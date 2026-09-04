import { ErrorConstant } from '@libs/constants/error.constant';
import { CallHandler, ExecutionContext, HttpStatus, Injectable, NestInterceptor } from '@nestjs/common';
import { Response } from 'express';
import { ClsServiceManager } from 'nestjs-cls';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export const defaultResponse: IResponse<[]> = {
  success: true,
  statusCode: HttpStatus.OK,
  message: '',
  data: null,
  validatorErrors: [],
};

export interface IResponse<T> {
  statusCode?: HttpStatus;
  data?: T;
  _metadata?: {
    [key: string]: any;
  };
  message?: string | null;
  errorCode?: string;
  success?: boolean;
  validatorErrors?: any[];
  requestId?: string;
}

export function createResponse<T>(data: any): IResponse<T> {
  let meta = data?.meta ? { ...data.meta, timestamp: new Date() } : { timestamp: new Date() };

  // cursor paginate
  if (data?.cursor) {
    meta = data.cursor;
  }

  if (data?.meta) {
    data = data?.items;
  }

  return {
    statusCode: data?.statusCode ? data.statusCode : HttpStatus.OK,
    data: data?.data || data || [],
    _metadata: meta,
    success: true,
    message: data?.message ? data?.message : ErrorConstant.DEFAULT.SUCCESS.message,
    errorCode: data?.errorCode ? data?.errorCode : ErrorConstant.DEFAULT.SUCCESS.errorCode,
  };
}
@Injectable()
export class ResponseTransformInterceptor<T> implements NestInterceptor<T, IResponse<T>> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<IResponse<T>> {
    return next.handle().pipe(
      map(data => {
        const ctx = context.switchToHttp();
        const response = ctx.getResponse<Response>();
        const responseData = createResponse(data);
        response.status(responseData.statusCode);
        return { ...createResponse(data), requestId: ClsServiceManager.getClsService().getId() };
      }),
    );
  }
}
