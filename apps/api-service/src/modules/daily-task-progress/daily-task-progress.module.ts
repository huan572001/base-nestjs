import { Module } from '@nestjs/common';
import { DailyTaskProgressRepository } from '@libs/infra/postgres/repositories/daily-task-progress.repository';
import { DailyTaskProgressService } from './daily-task-progress.service';
import { DailyTaskProgressController } from './daily-task-progress.controller';
import { AptosIndexerModule } from '@lib/service/aptos-indexer/aptos-indexer.module';
import { StrategyModule } from '../strategy/strategy.module';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [AptosIndexerModule, StrategyModule, HttpModule],
  controllers: [DailyTaskProgressController],
  providers: [DailyTaskProgressService, DailyTaskProgressRepository],
  exports: [DailyTaskProgressService],
})
export class DailyTaskProgressModule {}
