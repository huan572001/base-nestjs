import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import BaseEntity from './base.entity';

@Entity({ name: 'history_positions' })
export class HistoryPositionEntity extends BaseEntity {
  @PrimaryGeneratedColumn()
  public id: number;

  @Column({ type: 'varchar', name: 'clmm_pool_id' })
  clmmPoolId: string;

  @Column({ type: 'varchar', name: 'pool_id' })
  poolId: string;

  @Column({ type: 'float', name: 'price' })
  price: number;

  @Column({ type: 'float', name: 'lower_range' })
  lowerRange: number;

  @Column({ type: 'float', name: 'hight_range' })
  hightRange: number;

  @Column({ type: 'float', name: 'threshold' })
  threshold: number;

  @Column({ type: 'varchar', name: 'tvl' })
  tvl: string;

  @Column({ type: 'bigint', name: 'timestamp' })
  timestamp: number;

  @Column({ type: 'float', name: 'yields' })
  yields: number; // total yields in the range

  @Column({ type: 'varchar', name: 'apy' })
  apy: string;

  @Column({ type: 'numeric', name: 'cumulative_yields', default: 0 })
  cumulativeYields: number;
}
