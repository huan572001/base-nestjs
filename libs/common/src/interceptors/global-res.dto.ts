import { ApiProperty } from '@nestjs/swagger';

export class GlobalResDto<T> {
  @ApiProperty({ example: 200 })
  statusCode: number;

  @ApiProperty({ type: 'object' })
  data: T;

  @ApiProperty({ example: { timestamp: '2025-03-21T08:55:31.136Z' } })
  _metadata: {
    timestamp: string;
  };

  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: 'Success' })
  message: string;

  @ApiProperty({ example: '000000' })
  errorCode: string;

  @ApiProperty({ example: 'n_qpiKXa8-RtzUBi58SeG' })
  requestId: string;
}
