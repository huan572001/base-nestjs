import { TicketType } from '@libs/infra/postgres/entities/ticket.entity';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';

export class GetTicketSummaryQueryDto {
  @ApiPropertyOptional({
    example: '0xA12345...',
    description: 'Address (optional)',
  })
  @IsOptional()
  @IsString()
  walletAddress?: string;

  @ApiPropertyOptional({
    enum: TicketType,
    description: `${Object.values(TicketType).join(', ')} (optional)`,
    example: TicketType.DAILY,
  })
  @IsOptional()
  @IsEnum(TicketType)
  type?: TicketType;
}
export interface TicketSummary {
  walletAddress: string;
  totalClaimTrue: number;
  totalClaimFalse: number;
  totalTickets: number;
}
