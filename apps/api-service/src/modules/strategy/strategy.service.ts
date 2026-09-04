import { Aptos, InputViewFunctionData } from '@aptos-labs/ts-sdk';
import { LoggerService } from '@libs/common/loggers';
import { StrategyEntity } from '@libs/infra/postgres/entities/strategy.entity';
import { StrategyRepository } from '@libs/infra/postgres/repositories';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EEnvKey } from '@libs/constants/env.constant';
import { InjectRepository } from '@nestjs/typeorm';
import { AptosService } from '@libs/infra/aptos/aptos.service';
import { BigNumber } from 'bignumber.js';
import { IsNull, Not } from 'typeorm';
import { RedisService } from '@libs/infra/redis';
@Injectable()
export class StrategyService {
  private readonly logger = new LoggerService().getLogger(StrategyService.name);
  private readonly aptos: Aptos;
  private readonly snaxfiModuleAddress: string;
  constructor(
    private configService: ConfigService,
    private readonly aptosService: AptosService,
    @InjectRepository(StrategyEntity)
    private readonly strategyRepository: StrategyRepository,
    private readonly _redisService: RedisService,
  ) {
    this.aptos = this.aptosService.getAptos();
    this.snaxfiModuleAddress = this.configService.get<string>(EEnvKey.SNAXFI_SC_ADDRESS);
  }

  async updateActivePoolByPoolId(clmmPoolId: string, isActive: boolean, poolId: string): Promise<void> {
    await this.strategyRepository.update({ clmmPoolId }, { isActive, poolId });
  }

  async getActiveStrategies(): Promise<Array<StrategyEntity>> {
    const strategies = await this.strategyRepository.find({
      where: { isActive: true },
      order: { apy: 'DESC' },
    });

    return strategies;
  }

  async getStrategyByPoolId(poolId: string): Promise<StrategyEntity | null> {
    return this.strategyRepository.findOne({ where: { poolId } });
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
      ] = await this.aptos.view({ payload });
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

  async getAllPriceTokenOracle(): Promise<any> {
    try {
      const strategies = await this.strategyRepository.find({
        where: { isActive: true, poolId: Not(IsNull()) },
      });
      const map = new Map<string, string>();
      strategies.forEach(strategy => {
        map.set(`${strategy.baseToken}`, strategy.baseToken);
        map.set(`${strategy.quoteToken}`, strategy.quoteToken);
      });
      const uniqueTokens = Array.from(map.values());
      const tasks = uniqueTokens.map(async token => {
        const key = `price:${token}`;
        const price = await this._redisService.get(key);
        return { token, price };
      });
      const prices = await Promise.all(tasks);
      return prices;
    } catch (error) {
      console.error(`Error fetching all price token oracle:`, error);
      return null;
    }
  }
}
