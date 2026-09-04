import { Module } from '@nestjs/common';
import { CronjobService } from './cronjob.service';
import { PointModule } from '@api/modules/point/point.module';

@Module({
  imports: [PointModule],
  providers: [CronjobService],
})
export class CronjobModule {}
