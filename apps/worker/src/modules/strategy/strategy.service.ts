import { Inject, Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { HyperionIndexerService } from '@lib/service/hyperion-indexer/hyperion-indexer.service';
import { InjectRepository } from '@nestjs/typeorm';
import { StrategyRepository, TicketRepository, TransactionEventsRepository } from '@libs/infra/postgres/repositories';
import { Dex } from '@libs/constants/entity.constant';
import { Not, IsNull, LessThanOrEqual, Repository, In } from 'typeorm';
import { StrategyEntity } from '@libs/infra/postgres/entities/strategy.entity';
import { CollectFeesAndRewardsEventPayload, PoolCreatedEventPayload } from './events';
import { Logger } from '@libs/common/loggers';
import { AccountAddress, Aptos, InputViewFunctionData } from '@aptos-labs/ts-sdk';
import { APTOS_INSTANCE_TOKEN } from '@libs/infra/aptos';
import { AptosService } from '@libs/infra/aptos/aptos.service';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { EEnvKey } from '@libs/constants/env.constant';
import { lastValueFrom } from 'rxjs';
import { HistoryPositionEntity } from '@libs/infra/postgres/entities/history-position.entity';
import { TransactionType } from '@libs/infra/postgres/entities/transaction-events.entity';
import { WithdrawRewardsEventPayload } from './events/withdraw-reward.event';
import { WithdrawEventPayload } from './events/withdraw.event';
import { RedisService } from '@libs/infra/redis';
import { DepositEventPayload } from './events/deposit.event';
import { TicketMintEventPayload } from './events/mint-ticket.event';
import { BigNumber } from 'bignumber.js';

@Injectable()
export class StrategyService {
  private readonly _logger = new Logger(StrategyService.name);
  private readonly snaxfiModuleAddress: string;

  constructor(
    @Inject(APTOS_INSTANCE_TOKEN)
    private readonly _aptos: Aptos,
    private readonly aptosService: AptosService,
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    private readonly hyperionService: HyperionIndexerService,
    private readonly _redisService: RedisService,

    @InjectRepository(StrategyEntity)
    private readonly strategyRepository: StrategyRepository,
    @InjectRepository(HistoryPositionEntity)
    private readonly historyPositionRepository: Repository<HistoryPositionEntity>,
    private readonly transactionEventRepository: TransactionEventsRepository,
    private readonly ticketRepository: TicketRepository,
  ) {
    this.snaxfiModuleAddress = this.configService.get<string>(EEnvKey.SNAXFI_SC_ADDRESS);
  }

  @Cron(CronExpression.EVERY_30_MINUTES)
  async syncStrategy() {
    await this.hyperionService.syncStrategy();
  }

  @Cron(CronExpression.EVERY_5_MINUTES)
  async rebalanceStrategies() {
    const strategies = await this.strategyRepository.find({
      where: { isActive: true, poolId: Not(IsNull()) },
    });
    // Rebalance Hyperion strategies
    await this.hyperionService.rebalanceHyperionStrategies(
      strategies.filter(strategy => strategy.dex === Dex.HYPERION),
    );
    // Set price cache for strategies
    await this.setPriceCache(strategies);
    // We can Implement rebalance for other DEXs if needed
  }

  @Cron(CronExpression.EVERY_6_HOURS)
  async compoundStrategies() {
    const strategies = await this.strategyRepository.find({
      where: { isActive: true, poolId: Not(IsNull()) },
    });
    // Compound Hyperion strategies
    await this.hyperionService.compoundHyperionStrategies(strategies.filter(strategy => strategy.dex === Dex.HYPERION));
    // We can Implement compound for other DEXs if needed
  }

  // Handle the PoolCreatedEvent
  async handlePoolCreatedEvent(payload: PoolCreatedEventPayload) {
    const { clmmPool, id: poolId } = payload;
    this._logger.info('Handling PoolCreatedEvent with payload', payload);
    const dexPoolId = clmmPool.inner;
    await this.strategyRepository.update(
      {
        clmmPoolId: dexPoolId,
      },
      {
        poolId,
        dex: Dex.HYPERION,
        isActive: true,
      },
    );
    this._logger.info(`Strategy for pool ${dexPoolId} with poolId ${poolId} created or updated successfully.`);
  }

  // Handle CollectFeesAndRewardsEvent
  async handleCollectFeesAndRewardsEvent(payload: CollectFeesAndRewardsEventPayload, txVersion: string) {
    this._logger.info('Handling CollectFeesAndRewardsEvent with payload', payload);
    try {
      const strategy = await this.strategyRepository.findOne({
        where: { poolId: payload.poolId },
      });
      if (!strategy) {
        this._logger.warn(`No strategy found for poolId ${payload.poolId}. Skipping event handling.`);
        return;
      }
      const tx = await this._aptos.transaction.getTransactionByVersion({ ledgerVersion: Number(txVersion) });
      const timestamp = (tx as any).timestamp;

      const rewardFiatValues: number[] = [];
      for (const rewardData of payload.rewards.data) {
        if (rewardData.value === '0') {
          continue;
        }

        const fungibleAssetAddress = rewardData.key.inner;
        const tokenAddress = await this.aptosService.getTokenAddress(fungibleAssetAddress);
        const fungibleAssetMetadata = await this._aptos.fungibleAsset.getFungibleAssetMetadataByAssetType({
          assetType: tokenAddress,
        });
        const priceData = await this.getPrice(fungibleAssetAddress, timestamp);
        const price = priceData.data.priceEqualOrBelow;
        const fiatValue = (price * Number(rewardData.value)) / 10 ** fungibleAssetMetadata.decimals;
        rewardFiatValues.push(fiatValue);
      }
      let totalFiatValue = rewardFiatValues.reduce((acc, value) => acc + value, 0);
      this._logger.info(`Total fiat value from rewards: ${totalFiatValue}`);

      // fee value
      const priceTokenA = await this.getPrice(strategy.baseToken, timestamp);
      const priceTokenB = await this.getPrice(strategy.quoteToken, timestamp);

      const feeTokenADecimals = await this.aptosService.getTokenDecimals(strategy.baseToken);
      const feeTokenBDecimals = await this.aptosService.getTokenDecimals(strategy.quoteToken);

      totalFiatValue +=
        (priceTokenA.data.priceEqualOrBelow * Number(payload.feeTokenAAmount)) / 10 ** feeTokenADecimals;
      totalFiatValue +=
        (priceTokenB.data.priceEqualOrBelow * Number(payload.feeTokenBAmount)) / 10 ** feeTokenBDecimals;
      this._logger.info(`Total fiat value from fees and rewards: ${totalFiatValue}`);

      const closestHistoryPosition = await this.historyPositionRepository.findOne({
        where: {
          poolId: payload.poolId,
          timestamp: LessThanOrEqual(timestamp),
        },
        order: { timestamp: 'DESC' },
      });
      closestHistoryPosition.yields = Number(closestHistoryPosition.yields) + totalFiatValue;
      closestHistoryPosition.cumulativeYields = Number(closestHistoryPosition.cumulativeYields) + totalFiatValue;
      await closestHistoryPosition.save();
      await this.historyPositionRepository
        .createQueryBuilder()
        .update()
        .set({
          cumulativeYields: () => `"cumulative_yields" + :totalFiatValue`,
        })
        .where('poolId = :poolId', { poolId: payload.poolId })
        .andWhere('timestamp > :timestamp', { timestamp: closestHistoryPosition.timestamp })
        .setParameters({ totalFiatValue })
        .execute();
      this._logger.info('Handled CollectFeesAndRewardsEvent successfully');
    } catch (error) {
      this._logger.error('Error handling CollectFeesAndRewardsEvent:', error);
    }
  }

  async getTokenPriceFromOracle(fungibleAssetAddress: string) {
    try {
      const tokenPrice = await this._aptos.view({
        payload: {
          function: `${this.snaxfiModuleAddress}::oracle::get_price`,
          typeArguments: [],
          functionArguments: [fungibleAssetAddress],
        },
      });
      return Number(tokenPrice[0]) / 10 ** 8;
    } catch (error) {
      this._logger.error('Error fetching token price:', error);
      return 0;
    }
  }

  async getPrice(fungibleAssetAddress: string, timestamp: number) {
    const tokenAddress = await this.aptosService.getTokenAddress(fungibleAssetAddress);

    const priceServiceEndpoint = this.configService.get<string>(EEnvKey.PRICE_SERVER_URL);
    const priceServiceApiKey = this.configService.get<string>(EEnvKey.PRICE_SERVER_API_KEY);

    const { data: priceData } = await lastValueFrom(
      this.httpService.get(`${priceServiceEndpoint}/api/prices?coinType=${tokenAddress}&timestamp=${timestamp}`, {
        headers: {
          'x-api-key': priceServiceApiKey,
        },
      }),
    ).catch(async error => {
      this._logger.error(`Error fetching price for token ${tokenAddress} from price service:`, error.message);
      this._logger.log(`Fetching price for token ${tokenAddress} from oracle as fallback`);
      const price = await this.getTokenPriceFromOracle(AccountAddress.from(fungibleAssetAddress).toStringLong());
      return { data: { data: { priceEqualOrBelow: price } } };
    });

    return priceData;
  }

  async setPriceCache(strategies: StrategyEntity[]) {
    this._logger.info('Setting price cache for strategies');
    try {
      const cacheTimePrice = 3000;
      const map = new Map<string, string>();
      strategies.forEach(strategy => {
        map.set(`${strategy.baseToken}`, strategy.baseToken);
        map.set(`${strategy.quoteToken}`, strategy.quoteToken);
      });
      const uniqueTokens = Array.from(map.values());
      const tasks = uniqueTokens.map(async token => {
        const key = `price:${token}`;

        try {
          const cached = await this._redisService.get<number>(key);
          if (cached === null) {
            const price = await this.getTokenPriceFromOracle(AccountAddress.from(token).toStringLong());
            await this._redisService.set(key, price, cacheTimePrice);
          }
        } catch (err) {
          this._logger.error(`Error caching token ${token}:`, err);
        }
      });
      await Promise.all(tasks);
      this._logger.info('Price cache set successfully');
    } catch (error) {
      this._logger.error('Error setting price cache:', error);
    }
  }

  async handleAddLiquidityOrWithdrawEvent(
    payload: DepositEventPayload | WithdrawEventPayload,
    address: string,
    txVersion: number,
    type: TransactionType,
    timestamp: number,
  ) {
    this._logger.info('Handling handleAddLiquidityOrWithdrawEvent with payload', payload);
    try {
      const strategy = await this.strategyRepository.findOne({
        where: { poolId: payload.poolId },
      });
      if (!strategy) {
        this._logger.warn(`No strategy found for poolId ${payload.poolId}. Skipping event handling.`);
        return;
      }
      await this.asyncPoolInfo(strategy.poolId);

      console.time('txEvent');
      const txEvent = await this.transactionEventRepository.findOne({
        where: {
          txVersion: txVersion,
          type: type,
        },
      });
      if (txEvent) {
        this._logger.warn(
          `Transaction event already exists for txVersion ${txVersion} and type ${type}. Skipping event handling.`,
        );
        return;
      }
      console.timeEnd('txEvent');
      console.time('calculateTokenValue');
      const [valueUsdA, valueUsdB] = await Promise.all([
        this.calculateTokenValue(strategy.baseToken, payload.amountA),
        this.calculateTokenValue(strategy.quoteToken, payload.amountB),
      ]);
      const safeValueUsdA = isNaN(valueUsdA) ? 0 : valueUsdA;
      const safeValueUsdB = isNaN(valueUsdB) ? 0 : valueUsdB;
      console.timeEnd('calculateTokenValue');
      this._logger.info(
        `Calculated valueUsdA: ${safeValueUsdA}, valueUsdB: ${safeValueUsdB} for poolId ${payload.poolId}`,
      );
      const valueUsd = safeValueUsdA + safeValueUsdB;

      const event = await this.transactionEventRepository.create({
        address: address,
        type: type,
        data: payload,
        valueUsd: valueUsd,
        txVersion: txVersion,
        timestamp: timestamp,
        poolId: payload.poolId,
      });
      await this.transactionEventRepository.save(event);
      this._logger.info(`Handled CollectFeesAndRewardsEvent successfully`);
    } catch (error) {
      this._logger.error('Error handling AddLiquidityEvent:', error);
    }
  }

  async handleWithdrawRewardEvent(payload: WithdrawRewardsEventPayload, txVersion: number, timestamp: number) {
    try {
      const strategy = await this.strategyRepository.findOne({
        where: { poolId: payload.poolId },
      });
      if (!strategy) {
        this._logger.warn(`No strategy found for poolId ${payload.poolId}. Skipping event handling.`);
        return;
      }
      await this.asyncPoolInfo(strategy.poolId);
      const txEvent = await this.transactionEventRepository.findOne({
        where: {
          txVersion: txVersion,
          type: TransactionType.WITHDRAW_REWARDS,
        },
      });
      if (txEvent) {
        this._logger.warn(
          `Transaction event already exists for txVersion ${txVersion} and type ${TransactionType.WITHDRAW_REWARDS}. Skipping event handling.`,
        );
        return;
      }
      const dataReward = payload.rewards.data;
      const valueUsd = dataReward.map(reward => {
        return this.calculateTokenValue(reward.key.inner, reward.value);
      });
      const totalValueUsd = (await Promise.all(valueUsd)).reduce((acc, value) => acc + value, 0);
      const event = await this.transactionEventRepository.create({
        address: payload.user,
        type: TransactionType.WITHDRAW_REWARDS,
        data: payload,
        valueUsd: totalValueUsd,
        txVersion: txVersion,
        timestamp: timestamp,
        poolId: payload.poolId,
      });
      await this.transactionEventRepository.save(event);
    } catch (error) {
      this._logger.error('Error handling WithdrawRewardEvent:', error);
    }
  }
  private async calculateTokenValue(token: string, amount: string): Promise<number> {
    let priceData = 0;
    let decimalData = 8;
    const cacheTimePrice = 3000; // Cache for 5 minutes
    const cacheDecimal = 60 * 60 * 24; // Cache for 24 hours
    const decimalRedis = await this._redisService.get<number>(`decimal:${token}`);
    if (decimalRedis) {
      decimalData = decimalRedis;
    } else {
      const tokenAddress = await this.aptosService.getTokenAddress(token);
      const metadata = await this._aptos.fungibleAsset.getFungibleAssetMetadataByAssetType({
        assetType: tokenAddress,
      });
      decimalData = metadata.decimals;
      this._redisService.set(`decimal:${token}`, decimalData, cacheDecimal);
    }

    const priceRedis = await this._redisService.get<number>(`price:${token}`);
    if (priceRedis) {
      priceData = priceRedis;
    } else {
      priceData = await this.getTokenPriceFromOracle(AccountAddress.from(token).toStringLong());
      this._redisService.set(`price:${token}`, priceData, cacheTimePrice);
    }
    return (priceData * Number(amount)) / 10 ** decimalData;
  }

  async updateTicketedClaim(payload: TicketMintEventPayload) {
    try {
      const ticketIds = payload.ticketIds;
      const tickets = await this.ticketRepository.find({
        where: { id: In(ticketIds), walletAddress: payload.user, isClaim: false },
      });

      if (tickets.length === 0) {
        this._logger.error(`Error: No tickets found for user: ${payload.user}`);
        return;
      }

      await this.ticketRepository.update(
        { id: In(ticketIds), walletAddress: payload.user, isClaim: false },
        { isClaim: true },
      );

      this._logger.info(`Successfully updated ticketed claims for user ${payload.user}`);
    } catch (error) {
      this._logger.error(`Error updating ticketed claim for user ${payload.user}:`, error);
    }
  }

  public async getStrategyDetails(poolId: string) {
    try {
      const payload: InputViewFunctionData = {
        function: `${this.snaxfiModuleAddress}::hyperion_pool::get_pool_info`,
        typeArguments: [],
        functionArguments: [poolId],
      };
      const [
        ,
        ,
        inner,
        ,
        ,
        amount_a_in_store,
        amount_b_in_store,
        cap,
        tvl,
        totalLp,
        ,
        managementFeeRate,
        performanceFeeRate,
        ,
        tickLower,
        tickUpper,
        ,
        rebalanceThreshold,
      ] = await this._aptos.view({ payload });
      const price = new BigNumber(tvl as string).dividedBy((totalLp || '1') as string).toNumber();
      return {
        inner: (
          inner as {
            inner: string;
          }
        ).inner,
        cap,
        tvl,
        managementFeeRate,
        performanceFeeRate,
        tickLower,
        tickUpper,
        rebalanceThreshold,
        amount_a_in_store,
        amount_b_in_store,
        totalLp,
        price,
      };
    } catch (error) {
      console.error(`Error fetching strategy details for poolId ${poolId}:`, error);
      return null;
    }
  }

  async asyncPoolInfo(poolId: string) {
    const strategies = await this.strategyRepository.findOne({
      where: {
        poolId,
      },
    });
    if (!strategies) {
      return;
    }
    const poolInfo = await this.getStrategyDetails(poolId);
    strategies.price = poolInfo?.price || 0;
    strategies.totalValueLock = String(poolInfo?.tvl || '0');
    await strategies.save();
    return poolInfo;
  }
}
