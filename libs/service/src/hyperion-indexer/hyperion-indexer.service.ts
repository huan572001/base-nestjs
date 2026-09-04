import { Logger } from '@libs/common/loggers';
import { HYPERION_INDEXER_HTTP_TOKEN, IHttpService } from '@libs/infra/http';
import { StrategyEntity } from '@libs/infra/postgres/entities/strategy.entity';
import { HistoryPositionRepository, StrategyRepository } from '@libs/infra/postgres/repositories';
import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { fetchPoolHyperion, FetchPoolHyperionDto } from './dto/get_pool.dto';
import { COMPOUND_INTEREST } from '@libs/constants/context.constant';
import { EEnvKey } from '@libs/constants/env.constant';
import BigNumber from 'bignumber.js';
import { Aptos, InputGenerateTransactionPayloadData, InputViewFunctionData } from '@aptos-labs/ts-sdk';
import { AptosService } from '@libs/infra/aptos/aptos.service';
import { calculatePriceFromSqrtPrice } from '@libs/common/utils/function';
import { Dex } from '@libs/constants/entity.constant';

@Injectable()
export class HyperionIndexerService {
  private readonly _logger = new Logger(HyperionIndexerService.name);
  private readonly aptos: Aptos;
  private readonly snaxfiModuleAddress: string;
  private readonly moduleAddressHyperion: string;
  private sqrtPriceCache: Record<number, any> = {};

  public constructor(
    private readonly aptosService: AptosService,
    @Inject(HYPERION_INDEXER_HTTP_TOKEN) private _httpService: IHttpService,
    private readonly strategyRepository: StrategyRepository,
    private configService: ConfigService,
    private readonly historyPositionRepository: HistoryPositionRepository,
  ) {
    this.aptos = this.aptosService.getAptos();
    this.snaxfiModuleAddress = this.configService.get<string>(EEnvKey.SNAXFI_SC_ADDRESS);
    this.moduleAddressHyperion = this.configService.get<string>(EEnvKey.HYPERION_SC_ADDRESS);
  }

  async syncStrategy() {
    try {
      const pools = await this.fetchPoolStats();
      const strategyMap = await this.mapStrategies();

      for (const stat of pools) {
        await this.handleStrategy(stat, strategyMap);
      }

      this._logger.info('Sync strategies success');
    } catch (error) {
      this._logger.error('Error syncing strategies', error);
    }
  }

  private async fetchPoolStats() {
    const response = await this._httpService.post<FetchPoolHyperionDto>('/', {
      query: fetchPoolHyperion(),
    });
    return response.data?.data?.api?.getPoolStat || [];
  }

  private async mapStrategies(): Promise<Record<string, StrategyEntity>> {
    const strategies = await this.strategyRepository.find();
    return Object.fromEntries(strategies.map(s => [s.clmmPoolId, s]));
  }

  private async handleStrategy(stat: any, strategyMap: Record<string, StrategyEntity>) {
    const pool = stat.pool;
    const apr = new BigNumber(stat.farmAPR || '0').plus(stat.feeAPR || '0').toNumber();
    const apy = this.calculateAPY(apr, COMPOUND_INTEREST);
    let inner = null;
    const price = calculatePriceFromSqrtPrice(
      stat.pool.sqrtPrice,
      stat.pool.token1Info.decimals,
      stat.pool.token2Info.decimals,
    );

    const existed = strategyMap[pool.poolId];

    let strategyDetails = this.initializeStrategyDetails();

    if (existed?.isActive && existed.poolId) {
      const closestHistory = await this.historyPositionRepository.findOne({
        where: { poolId: existed.poolId },
        order: { timestamp: 'DESC' },
      });
      const cumulativeYields = closestHistory?.cumulativeYields || 0;
      strategyDetails = await this.getStrategyDetails(existed.poolId, stat);
      inner = strategyDetails.inner;
      await this.saveHistory(existed.clmmPoolId, existed.poolId, price, apy, strategyDetails, cumulativeYields);
    }

    await this.strategyRepository.upsert(
      {
        clmmPoolId: pool.poolId,
        baseToken: pool.token1,
        quoteToken: pool.token2,
        feeTier: pool.feeTier,
        feeRate: pool.feeRate,
        apy,
        totalValueLock: strategyDetails.totalValueLock,
        protocol: this.configService.get<string>(EEnvKey.HYPERION_SC_ADDRESS),
        managementFee: strategyDetails.managementFee,
        performanceFee: strategyDetails.performanceFee,
        capacity: strategyDetails.capacity,
        LbBreakdown: [],
        isActive: existed?.isActive ?? false,
        price,
        inner,
        dex: Dex.HYPERION,
      },
      ['clmmPoolId'],
    );
  }

  private initializeStrategyDetails() {
    return {
      managementFee: 0,
      performanceFee: 0,
      totalValueLock: '0',
      capacity: 0,
      lowerRange: 0,
      hightRange: 0,
      threshold: 0,
      inner: null,
    };
  }

  private async getStrategyDetails(poolId: string, stat: any) {
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
      ,
      ,
      cap,
      tvl,
      ,
      ,
      managementFeeRate,
      performanceFeeRate,
      ,
      tickLower,
      tickUpper,
      ,
      rebalanceThreshold,
    ] = await this.aptos.view({ payload });

    const priceSqrtLower = await this.getSqrtPriceAtTickCached(Number(tickLower));
    const priceSqrtUpper = await this.getSqrtPriceAtTickCached(Number(tickUpper));

    return {
      managementFee: Number(managementFeeRate),
      performanceFee: Number(performanceFeeRate),
      totalValueLock: String(tvl),
      capacity: Number(cap),
      lowerRange: calculatePriceFromSqrtPrice(
        priceSqrtLower,
        stat.pool.token1Info.decimals,
        stat.pool.token2Info.decimals,
      ),
      hightRange: calculatePriceFromSqrtPrice(
        priceSqrtUpper,
        stat.pool.token1Info.decimals,
        stat.pool.token2Info.decimals,
      ),
      threshold: Number(rebalanceThreshold),
      inner: (inner as { inner: string })?.inner,
    };
  }

  private async saveHistory(
    clmmPoolId: string,
    poolId: string,
    price: number,
    apy: string,
    details: any,
    cumulativeYields: number,
  ) {
    await this.historyPositionRepository.save({
      clmmPoolId,
      poolId,
      price,
      lowerRange: details.lowerRange,
      hightRange: details.hightRange,
      threshold: details.threshold,
      tvl: details.totalValueLock,
      timestamp: Math.floor(Date.now() / 1000),
      yields: 0,
      apy,
      cumulativeYields,
    });
  }

  private calculateAPY(aprPercent: number, compoundInterest: number): string {
    const apr = new BigNumber(aprPercent);
    const ratePerPeriod = apr.div(100).div(compoundInterest);
    const base = new BigNumber(1).plus(ratePerPeriod);
    const exponent = base.pow(compoundInterest);
    const apy = exponent.minus(1).times(100);
    return apy.toFixed(6);
  }

  private async getSqrtPriceAtTickCached(tick: number): Promise<any> {
    if (this.sqrtPriceCache[tick] !== undefined) {
      return this.sqrtPriceCache[tick];
    }
    const payloadHyperion: InputViewFunctionData = {
      function: `${this.moduleAddressHyperion}::tick_math::get_sqrt_price_at_tick_u32`,
      typeArguments: [],
      functionArguments: [tick],
    };
    const [priceSqrt] = await this.aptos.view({ payload: payloadHyperion });
    this.sqrtPriceCache[tick] = priceSqrt;
    return priceSqrt;
  }

  async rebalanceHyperionStrategies(strategies: StrategyEntity[]) {
    try {
      // Fetch rebalance information
      const rebalanceData = await Promise.all(
        strategies.map(async strategy => {
          const [, , , , , , , , , needToRebalance] = await this.aptos.view({
            payload: {
              function: `${this.snaxfiModuleAddress}::hyperion_pool::get_rebalance_info`,
              functionArguments: [strategy.poolId],
              typeArguments: [],
            },
          });
          return {
            poolId: strategy.poolId,
            needToRebalance,
          };
        }),
      );
      // Filter strategies that need to be rebalanced
      const rebalanceStrategies = rebalanceData.filter(item => item.needToRebalance);
      this._logger.info(`Rebalancing ${rebalanceStrategies.length} Hyperion strategies.`);
      if (rebalanceStrategies.length) {
        // Prepare batch data for rebalancing
        const batchData = rebalanceStrategies.map(item => {
          return {
            function: `${this.snaxfiModuleAddress}::hyperion_pool::rebalance`,
            typeArguments: [],
            functionArguments: [item.poolId],
          } as InputGenerateTransactionPayloadData;
        });
        // Execute batch transactions
        await this.aptosService.batchTransactions(batchData);
      }
    } catch (error) {
      this._logger.error('Error rebalancing Hyperion strategies', error);
      throw error;
    }
  }

  async compoundHyperionStrategies(strategies: StrategyEntity[]) {
    try {
      this._logger.info(`Compounding ${strategies.length} Hyperion strategies.`);
      const batchData = strategies.map(strategy => {
        return {
          function: `${this.snaxfiModuleAddress}::hyperion_pool::compound_fees_and_rewards`,
          typeArguments: [],
          functionArguments: [strategy.poolId],
        } as InputGenerateTransactionPayloadData;
      });
      // Execute batch transactions
      await this.aptosService.batchTransactions(batchData);
    } catch (error) {
      this._logger.error('Error compounding Hyperion strategies', error);
      throw error;
    }
  }
}
