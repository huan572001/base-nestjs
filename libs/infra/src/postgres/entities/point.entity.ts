import { Column, Entity, PrimaryGeneratedColumn, Unique } from 'typeorm';
import BaseEntity from './base.entity';

export interface TaskStatus {
  joinTelegramChannel: boolean;
  joinTelegramGroup: boolean;
  shareReferralLink: number;
  deposit: number;
  checkIn: boolean;
  checkOutX: boolean;
}

@Entity({ name: 'points' })
@Unique(['day', 'walletAddress'])
export class PointEntity extends BaseEntity {
  @PrimaryGeneratedColumn()
  public id: number;

  @Column({ type: 'bigint', name: 'day' })
  day: number;

  @Column({ type: 'varchar', name: 'wallet_address' })
  walletAddress: string;

  @Column({ type: 'numeric', precision: 20, scale: 18, name: 'point' })
  point: number;
}
