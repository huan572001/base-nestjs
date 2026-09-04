import { Module } from '@nestjs/common';
import { StrategyService } from './strategy.service';
import { HyperionIndexerModule } from '@lib/service/hyperion-indexer/hyperion-indexer.module';
import { StrategyConsumer } from './strategy.consumer';
import { HttpModule } from '@nestjs/axios';
import { PointModule } from '@api/modules/point/point.module';

@Module({
  imports: [HyperionIndexerModule, HttpModule, PointModule],
  providers: [StrategyService],
  controllers: [StrategyConsumer],
})
export class StrategyModule {}
