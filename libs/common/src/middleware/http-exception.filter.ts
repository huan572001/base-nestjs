import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from '@nestjs/common';
import { Response } from 'express';

import * as exc from '../exception';
import { Logger } from '../loggers';
import { ClsServiceManager } from 'nestjs-cls';
import { IResponse } from '../interceptors';
import { ErrorConstant } from '@libs/constants/error.constant';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  private logger = new Logger(HttpExceptionFilter.name);

  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    let excResponse = exception.getResponse() as IResponse<any> | any;
    this.logger.warn(excResponse);
    if (typeof excResponse !== 'object' || !excResponse.hasOwnProperty('success')) {
      let newDataResponse: Record<string, any> =
        typeof excResponse === 'object' ? excResponse : { message: excResponse };
      newDataResponse = newDataResponse?.message;
      excResponse = new exc.BadRequestException({
        statusCode: excResponse.statusCode ? excResponse.statusCode : HttpStatus.BAD_REQUEST,
        data: excResponse.data ? excResponse.data : null,
        validatorErrors: excResponse?.validatorErrors ? excResponse.validatorErrors : [],
        message: typeof newDataResponse === 'string' ? newDataResponse : 'unknown message',
        errorCode: excResponse?.errorCode ? excResponse.errorCode : ErrorConstant.DEFAULT.FAILED.errorCode,
        requestId: ClsServiceManager.getClsService().getId(),
      }).getResponse();
    }
    response.status(HttpStatus.OK).json(excResponse);
  }
}
