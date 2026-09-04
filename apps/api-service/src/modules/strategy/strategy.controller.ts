import { Controller, Param, Get } from '@nestjs/common';
import { StrategyService } from './strategy.service';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('strategy')
@Controller('strategy')
export class StrategyController {
  constructor(private readonly strategyService: StrategyService) {}

  @Get()
  async getActiveStrategies() {
    return this.strategyService.getActiveStrategies();
  }

  @Get('/get-price-token-oracle')
  async getAllPriceTokenOracle() {
    return this.strategyService.getAllPriceTokenOracle();
  }

  @Get('/:poolId')
  async getStrategyByPoolId(@Param('poolId') poolId: string) {
    return this.strategyService.getStrategyByPoolId(poolId);
  }
}
