import { IPaginationOptions } from 'nestjs-typeorm-paginate';
import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional } from 'class-validator';

export class BasePaginationDto implements IPaginationOptions {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  limit: number = 20;

  @ApiProperty({ required: false })
  @IsNumber()
  @IsOptional()
  page: number = 1;
}
