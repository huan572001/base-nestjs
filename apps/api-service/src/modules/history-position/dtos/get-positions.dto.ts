import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TimeFilterValues } from '@libs/constants/api.constant';

export class GetPositionsDto {
  @ApiProperty({ description: 'Pool ID ' })
  pool_id: string;

  @ApiPropertyOptional({
    description: 'Enum (day): 1, 7, 30',
    enum: TimeFilterValues,
  })
  time: string;
}
