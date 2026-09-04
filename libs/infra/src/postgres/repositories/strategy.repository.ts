import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StrategyEntity } from '../entities/strategy.entity';
import { BaseRepository } from './base.repository';

@Injectable()
export class StrategyRepository extends BaseRepository<StrategyEntity> {
  constructor(
    @InjectRepository(StrategyEntity)
    protected strategyRepository: Repository<StrategyEntity>,
  ) {
    super(strategyRepository);
  }

  async upsert(
    strategy: Partial<StrategyEntity>,
    conflictPaths: (keyof StrategyEntity)[] = ['clmmPoolId'],
  ): Promise<StrategyEntity> {
    await this.strategyRepository.upsert(strategy, conflictPaths as string[]);
    return this.strategyRepository.findOne({
      where: { clmmPoolId: strategy.clmmPoolId },
    });
  }

  async findAndCount(options?: Parameters<Repository<StrategyEntity>['findAndCount']>[0]) {
    return this.strategyRepository.findAndCount(options);
  }
}
