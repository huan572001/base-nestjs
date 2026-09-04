import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import BaseEntity from './base.entity';
import { Dex } from '@libs/constants/entity.constant';
interface LpBreakdown {
  assetToken: string;
  amount: number;
  value: number;
}
@Entity({ name: 'strategies' })
export class StrategyEntity extends BaseEntity {
  @PrimaryGeneratedColumn()
  public id: number;

  @Column({ type: 'varchar', name: 'clmm_pool_id' })
  clmmPoolId: string;

  @Column({ type: 'varchar', name: 'pool_id' })
  poolId: string;

  @Column({ type: 'enum', enum: Dex, name: 'dex' })
  dex: Dex;

  @Column('varchar', { name: 'protocol' })
  protocol: string;

  @Column('varchar', { name: 'base_token' })
  baseToken: string;

  @Column('varchar', { name: 'quote_token' })
  quoteToken: string;

  @Column({ type: 'varchar', name: 'apy' })
  apy: string;

  @Column({ type: 'varchar', name: 'total_value_lock' })
  totalValueLock: string;

  @Column({ type: 'float', name: 'management_fee' })
  managementFee: number;

  @Column({ type: 'float', name: 'performance_fee' })
  performanceFee: number;

  @Column({ type: 'float', name: 'capacity' })
  capacity: number;

  @Column('json', { name: 'lp_breakdown' })
  LbBreakdown: LpBreakdown[];

  @Column('boolean', { name: 'is_active' })
  isActive: boolean;

  @Column('float', { name: 'feeTier' })
  feeTier: number;

  @Column('float', { name: 'feeRate' })
  feeRate: number;

  @Column('float', { name: 'price' })
  price: number;

  @Column('varchar', { name: 'inner' })
  inner: string;
}
