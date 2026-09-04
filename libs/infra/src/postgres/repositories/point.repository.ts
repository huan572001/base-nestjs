import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PointEntity } from '../entities/point.entity';
import { BaseRepository } from './base.repository';

@Injectable()
export class PointRepository extends BaseRepository<PointEntity> {
  constructor(
    @InjectRepository(PointEntity)
    protected pointRepository: Repository<PointEntity>,
  ) {
    super(pointRepository);
  }
  async upsertAllData(strategies: Partial<PointEntity>[]): Promise<PointEntity[]> {
    await this.pointRepository.upsert(strategies, ['walletAddress', 'day'] as (keyof PointEntity)[]);
    const conditions = strategies.map(s => ({
      walletAddress: s.walletAddress,
      day: s.day,
    }));
    return this.pointRepository.find({
      where: conditions,
    });
  }
  async getDistinctWallets(): Promise<string[]> {
    const distinctWallets = await this.pointRepository
      .createQueryBuilder('point')
      .select('DISTINCT point.walletAddress', 'walletAddress')
      .getRawMany();
    return distinctWallets.map(w => w.walletAddress);
  }
}
