import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HistoryPositionEntity } from '../entities/history-position.entity';
import { BaseRepository } from './base.repository';

@Injectable()
export class HistoryPositionRepository extends BaseRepository<HistoryPositionEntity> {
  constructor(
    @InjectRepository(HistoryPositionEntity)
    protected historyPositionRepository: Repository<HistoryPositionEntity>,
  ) {
    super(historyPositionRepository);
  }
}
