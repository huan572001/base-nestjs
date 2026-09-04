import { Module } from '@nestjs/common';
import { HistoryPositionService } from './history-position.service';
import { HistoryPositionController } from './history-position.controller';

@Module({
  controllers: [HistoryPositionController],
  providers: [HistoryPositionService],
})
export class HistoryPositionModule {}
