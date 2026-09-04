import { Controller, Get, Query, Patch, Body } from '@nestjs/common';
import { ApiTags, ApiBody } from '@nestjs/swagger';
import { DailyTaskProgressService } from './daily-task-progress.service';
import { UpdateTasksDto } from './dtos/update-tasks.dto';

@ApiTags('daily-task-progress')
@Controller('daily-task-progress')
export class DailyTaskProgressController {
  constructor(private readonly dailyTaskProgressService: DailyTaskProgressService) {}

  @Get('/today')
  getToday(@Query('walletAddress') walletAddress: string) {
    return this.dailyTaskProgressService.getOrCreateToday(walletAddress);
  }

  @Patch('/updateTask')
  @ApiBody({ type: UpdateTasksDto })
  async updateTasks(@Body() body: UpdateTasksDto) {
    const { id, typeTask } = body;
    return this.dailyTaskProgressService.updateTasks(typeTask, id);
  }
}
