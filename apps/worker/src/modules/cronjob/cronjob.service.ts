import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Logger } from '@libs/common/loggers';
import { PointService } from '@api/modules/point/point.service';

@Injectable()
export class CronjobService {
  private readonly logger = new Logger(CronjobService.name);

  constructor(private readonly pointService: PointService) {}

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT) // test 5 minutes production 1 day
  async handleTimeIntervalJob() {
    try {
      this.logger.log('Running TIME_INTERVAL job: createAllPointsForAllUsersToday');
      await this.pointService.createAllPointsForAllUsersToday();
      await this.pointService.createTicketHoldingIn30DaysForAllUsers();
    } catch (error) {
      this.logger.error('Error in TIME_INTERVAL job createAllPointsForAllUsersToday:', error);
    }
  }
}
