import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString } from 'class-validator';
import { PagingQuery } from 'typeorm-cursor-pagination';

export class BaseCursorPaginationDto implements PagingQuery {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  limit: number = 20;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  afterCursor?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  beforeCursor?: string;
}
