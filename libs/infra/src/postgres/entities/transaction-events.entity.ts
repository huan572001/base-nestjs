import { Column, Entity, PrimaryGeneratedColumn, Unique } from 'typeorm';
import BaseEntity from './base.entity';
import { WithdrawRewardsEventPayload } from 'apps/worker/src/modules/strategy/events/withdraw-reward.event';
import { DepositEventPayload } from 'apps/worker/src/modules/strategy/events/deposit.event';

export enum TransactionType {
  DEPOSIT = 'deposit',
  WITHDRAW_REWARDS = 'withdraw_reward',
  WITHDRAW = 'withdraw',
  WITHDRAW_SINGLE = 'withdraw_single',
}

export type TransactionData = DepositEventPayload | WithdrawRewardsEventPayload;

@Entity({ name: 'transaction_events' })
@Unique(['type', 'txVersion'])
export class TransactionEventEntity extends BaseEntity {
  @PrimaryGeneratedColumn()
  public id: number;

  @Column({ type: 'varchar', name: 'address' })
  address: string;

  @Column({ type: 'varchar', name: 'pool_id' })
  poolId: string;

  @Column({ type: 'enum', enum: TransactionType, name: 'type' })
  type: TransactionType;

  @Column({ type: 'decimal', precision: 20, scale: 8, name: 'value_usd', default: 0 })
  valueUsd: number;

  @Column({ type: 'json', name: 'data' })
  data: TransactionData;

  @Column({ type: 'bigint', name: 'tx_version' })
  txVersion: number;

  @Column({ type: 'bigint', name: 'timestamp' })
  timestamp: number;
}
