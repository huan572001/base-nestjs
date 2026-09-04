import { Module } from '@nestjs/common';
import { StrategyService } from './strategy.service';
import { StrategyController } from './strategy.controller';
import { HyperionIndexerModule } from '@lib/service/hyperion-indexer/hyperion-indexer.module';

@Module({
  imports: [HyperionIndexerModule],
  controllers: [StrategyController],
  providers: [StrategyService],
  exports: [StrategyService],
})
export class StrategyModule {}
