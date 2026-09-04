import { Controller, Get } from '@nestjs/common';
import { ErrorConstant } from 'libs/constants/src/error.constant';

import { AppService } from './app.service';
import { Logger } from '@libs/common/loggers';

@Controller({
  path: '',
  version: '1',
})
export class AppController {
  logger = new Logger(AppController.name);
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }
  @Get('/error')
  getConstant() {
    throw new Error(ErrorConstant.DEFAULT.FAILED.message);

    return ErrorConstant;
  }

  // TODO: add health check
  @Get('/health')
  health(): string {
    this.logger.log('health check');
    return 'OK';
  }
}
