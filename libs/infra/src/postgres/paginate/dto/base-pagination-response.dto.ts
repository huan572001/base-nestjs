import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional } from 'class-validator';

export class BasePaginationResponseMetadata {
  @ApiProperty({ required: false })
  @IsNumber()
  @IsOptional()
  limit: number = 20;

  @ApiProperty({ required: false })
  @IsNumber()
  @IsOptional()
  page: number = 1;

  @ApiProperty({ required: false })
  @IsNumber()
  @IsOptional()
  total: number = 0;

  @ApiProperty({ required: false })
  @IsNumber()
  @IsOptional()
  totalPages: number = 0;
}

export class BasePaginationResponseDto<T> {
  @ApiProperty({ required: false })
  meta: BasePaginationResponseMetadata;

  @ApiProperty({ required: false })
  items: T[];
}
