import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DailyTaskProgressEntity } from '../entities/daily-task-progress.entity';
import { BaseRepository } from './base.repository';

@Injectable()
export class DailyTaskProgressRepository extends BaseRepository<DailyTaskProgressEntity> {
  constructor(
    @InjectRepository(DailyTaskProgressEntity)
    protected dailyTaskProgressRepository: Repository<DailyTaskProgressEntity>,
  ) {
    super(dailyTaskProgressRepository);
  }
}
