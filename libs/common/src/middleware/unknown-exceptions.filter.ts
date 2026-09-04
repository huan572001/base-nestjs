import { ArgumentsHost, Catch, ExceptionFilter, HttpStatus } from '@nestjs/common';
import { ClsServiceManager } from 'nestjs-cls';
import { Logger, LoggerService } from '../loggers';
import { IResponse } from '../interceptors';
import { ErrorConstant } from '@libs/constants/error.constant';

@Catch()
export class UnknownExceptionsFilter implements ExceptionFilter {
  constructor(private readonly loggingService: LoggerService) {}

  private logger = new Logger('unknown-exception');

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    this.logger.error(exception);

    const defaultResponse: IResponse<any> = {
      data: null,
      validatorErrors: [],
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      message: typeof exception === 'object' && exception?.message ? exception.message : 'unknown exception',
      errorCode: ErrorConstant.DEFAULT.FAILED.errorCode,
      success: false,
      requestId: ClsServiceManager.getClsService().getId(),
    };
    response.status(HttpStatus.OK).json(defaultResponse);
  }
}
