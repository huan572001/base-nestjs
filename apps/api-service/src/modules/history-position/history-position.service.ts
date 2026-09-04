import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MoreThan } from 'typeorm';
import { HistoryPositionEntity } from '@libs/infra/postgres/entities/history-position.entity';
import { HistoryPositionRepository } from '@libs/infra/postgres/repositories';
import { TimeFilter } from '@libs/constants/api.constant';

@Injectable()
export class HistoryPositionService {
  constructor(
    @InjectRepository(HistoryPositionEntity)
    private readonly historyPositionRepository: HistoryPositionRepository,
  ) {}

  async getPositions(poolId: string, time?: string) {
    const pool = await this.historyPositionRepository.findOne({
      where: { poolId },
    });
    if (!pool) {
      throw new Error('Can not find pool with this id');
    }
    const now = Math.floor(Date.now() / 1000);
    const days = time ? parseInt(time, 10) : TimeFilter.MONTH;
    const minTimestamp = now - days * 24 * 60 * 60;
    const whereClause = { poolId, timestamp: MoreThan(minTimestamp) };

    const data = await this.historyPositionRepository.find({
      where: whereClause,
      order: { timestamp: 'ASC' },
    });

    return data;
  }
}
