import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TicketEntity, TicketType } from '../entities/ticket.entity';
import { BaseRepository } from './base.repository';
import { TicketSummary } from '@api/modules/ticket/dtos/GetTicketSummaryDto';

@Injectable()
export class TicketRepository extends BaseRepository<TicketEntity> {
  constructor(
    @InjectRepository(TicketEntity)
    protected ticketRepository: Repository<TicketEntity>,
  ) {
    super(ticketRepository);
  }

  async getTicketSummary(walletAddress?: string, type?: TicketType): Promise<TicketSummary[]> {
    const query = this.ticketRepository
      .createQueryBuilder('ticket')
      .select('ticket.walletAddress', 'walletAddress')
      .addSelect(`SUM(CASE WHEN ticket.isClaim = true THEN 1 ELSE 0 END)`, 'totalClaimTrue')
      .addSelect(`SUM(CASE WHEN ticket.isClaim = false THEN 1 ELSE 0 END)`, 'totalClaimFalse')
      .addSelect(`COUNT(*)`, 'totalTickets')
      .groupBy('ticket.walletAddress');

    if (walletAddress) {
      query.andWhere('ticket.walletAddress = :walletAddress', { walletAddress });
    }

    if (type) {
      query.andWhere('ticket.type = :type', { type });
    }

    const result = await query.getRawMany();

    return result.map(r => ({
      walletAddress: r.walletAddress,
      totalClaimTrue: Number(r.totalClaimTrue),
      totalClaimFalse: Number(r.totalClaimFalse),
      totalTickets: Number(r.totalTickets),
    }));
  }
}
