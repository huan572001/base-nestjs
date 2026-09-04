import { Module } from '@nestjs/common';
import { PointRepository, UserRepository } from '@libs/infra/postgres/repositories';
import { PointService } from './point.service';
import { PointController } from './point.controller';
import { DailyTaskProgressModule } from '../daily-task-progress/daily-task-progress.module';

@Module({
  imports: [DailyTaskProgressModule],
  controllers: [PointController],
  providers: [PointService, PointRepository, UserRepository],
  exports: [PointService],
})
export class PointModule {}
