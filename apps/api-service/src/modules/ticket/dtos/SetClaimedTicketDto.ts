// dto/set-claimed-ticket.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsArray, ArrayNotEmpty, IsString, IsNotEmpty } from 'class-validator';
import { Type } from 'class-transformer';

export class SetClaimedTicketDto {
  @ApiProperty({
    type: [Number],
    description: 'List of ticket IDs to claim',
    example: [1, 2, 3],
  })
  @IsArray()
  @ArrayNotEmpty()
  @Type(() => Number)
  ticketIds: number[];

  @ApiProperty({
    type: String,
    description: 'Wallet address of the user',
    example: '0xabc123...',
  })
  @IsString()
  @IsNotEmpty()
  walletAddress: string;
}

export class SignDto {
  @ApiProperty({
    type: [Number],
    description: 'List of ticket IDs to claim',
    example: [1, 2, 3],
  })
  @IsArray()
  @ArrayNotEmpty()
  @Type(() => Number)
  ticketIds: number[];

  @ApiProperty({
    type: String,
    description: 'Wallet address of the user',
    example: '0xabc123...',
  })
  @IsString()
  @IsNotEmpty()
  walletAddress: string;
}
