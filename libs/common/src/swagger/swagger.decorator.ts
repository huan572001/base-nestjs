import { IPaginationMetadata } from '@libs/infra/postgres/paginate';
import { applyDecorators, HttpStatus, Type } from '@nestjs/common';
import { ApiExtraModels, ApiOkResponse, ApiOperation, ApiProperty, getSchemaPath } from '@nestjs/swagger';
import { ApiOperationOptions } from '@nestjs/swagger/dist/decorators/api-operation.decorator';
import { ApiPropertyOptions } from '@nestjs/swagger/dist/decorators/api-property.decorator';
import { Column as ColumnTypeOrm } from 'typeorm';
import { ColumnOptions } from 'typeorm/decorator/options/ColumnOptions';
import { IResponse } from '../interceptors';

export * from '@nestjs/swagger';

export function enumToObj(enumVariable: Record<string, any>): Record<string, any> {
  const enumValues = Object.values(enumVariable);
  const hLen = enumValues.length / 2;
  const object = {};
  for (let i = 0; i < hLen; i++) {
    object[enumValues[i]] = enumValues[hLen + i];
  }
  return object;
}

export function enumProperty(options: ApiPropertyOptions): ApiPropertyOptions {
  const obj = enumToObj(options.enum);
  const enumValues = Object.values(obj);
  return {
    example: enumValues[0],
    ...options,
    enum: enumValues,
    description: (options.description ?? '') + ': ' + JSON.stringify(obj),
  };
}

const createApiOperation = (defaultOptions: ApiOperationOptions) => {
  return (options?: ApiOperationOptions): MethodDecorator =>
    ApiOperation({
      ...defaultOptions,
      ...options,
    });
};

export const ApiEnumProperty = (options: ApiPropertyOptions) => ApiProperty(enumProperty(options));
export const ApiListOperation = createApiOperation({
  summary: 'List all',
});
export const ApiRetrieveOperation = createApiOperation({
  summary: 'Get data 1 record',
});
export const ApiCreateOperation = createApiOperation({
  summary: 'Create new record',
});
export const ApiUpdateOperation = createApiOperation({
  summary: 'Edit record',
});
export const ApiDeleteOperation = createApiOperation({
  summary: 'Delete record',
});
export const ApiBulkDeleteOperation = createApiOperation({
  summary: 'Delete many record',
});

export enum EApiOkResponsePayload {
  ARRAY = 'array',
  OBJECT = 'object',
}
export const ApiOkResponsePayload = <DataDto extends Type<unknown>>(
  dto: DataDto,
  type: EApiOkResponsePayload = EApiOkResponsePayload.ARRAY,
  apiOperationOptions: ApiOperationOptions = {
    summary: 'api description',
  },
  withPagination = false,
) => {
  const data =
    type === EApiOkResponsePayload.ARRAY
      ? {
          type: EApiOkResponsePayload.ARRAY,
          items: { $ref: getSchemaPath(dto) },
        }
      : {
          type: EApiOkResponsePayload.OBJECT,
          properties: {
            data: { $ref: getSchemaPath(dto) },
          },
        };

  const properties =
    type === EApiOkResponsePayload.ARRAY
      ? {
          properties: {
            data: data,
          },
        }
      : { ...data };

  return applyDecorators(
    ApiExtraModels(!withPagination ? ResponsePayload : ResponsePaginationPayload, dto),
    ApiOkResponse({
      schema: {
        allOf: [
          { $ref: getSchemaPath(!withPagination ? ResponsePayload : ResponsePaginationPayload) },
          {
            ...properties,
          },
        ],
      },
    }),
    ApiOperation({
      ...apiOperationOptions,
    }),
  );
};

export class ResponsePayload<T> implements IResponse<T> {
  @ApiEnumProperty({ enum: HttpStatus, example: HttpStatus.OK })
  statusCode?: HttpStatus;
  @ApiProperty()
  data?: T;
  @ApiProperty()
  _metadata?: {
    [key: string]: any;
  };
  @ApiProperty({ description: 'If success = fail, this is message error, default when success = null' })
  message?: string | null;
  @ApiProperty({ description: 'Check is success api' })
  success?: boolean;
  @ApiProperty({ description: 'Validate error with input data' })
  validatorErrors?: any[];
}
export class PaginationMetadata implements IPaginationMetadata {
  @ApiProperty({ description: 'the total amount of items' })
  totalItems: number;

  @ApiProperty({ description: 'the current page this paginator “points” to' })
  currentPage: number;

  @ApiProperty({ description: 'the amount of items on this specific page (i.e., the amount of items on this page)' })
  itemCount: number;

  @ApiProperty({ description: 'the total amount of pages in this paginator (i.e., the limit parameter)' })
  itemsPerPage: number;
}
export class ResponsePaginationPayload<T> extends ResponsePayload<T> {
  @ApiProperty({ type: PaginationMetadata })
  _metadata?: IPaginationMetadata;
}

export function Column(optionColumn?: ColumnOptions, optionApiProperty?: ApiPropertyOptions) {
  return applyDecorators(ColumnTypeOrm(optionColumn), ApiProperty(optionApiProperty));
}
