import { Controller, Get, Query } from '@nestjs/common';
import { HistoryPositionService } from './history-position.service';
import { ApiTags } from '@nestjs/swagger';
import { GetPositionsDto } from './dtos/get-positions.dto';

@Controller('history-position')
@ApiTags('history-position')
export class HistoryPositionController {
  constructor(private readonly historyPositionService: HistoryPositionService) {}

  @Get()
  async getPositions(@Query() query: GetPositionsDto) {
    return this.historyPositionService.getPositions(query.pool_id, query.time);
  }
}
