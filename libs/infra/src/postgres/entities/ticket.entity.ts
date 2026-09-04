import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import BaseEntity from './base.entity';
import { DailyTaskProgressEntity } from './daily-task-progress.entity';
export enum TicketType {
  DAILY = 'daily',
  REF = 'ref',
  DEPOSIT = 'deposit',
}
@Entity({ name: 'tickets' })
export class TicketEntity extends BaseEntity {
  @PrimaryGeneratedColumn()
  public id: number;

  @Column({ type: 'varchar', name: 'wallet_address' })
  walletAddress: string;

  @Column({ type: 'boolean', name: 'is_claim', default: false })
  isClaim: boolean;

  @Column({ type: 'enum', enum: TicketType, name: 'type', default: TicketType.DAILY })
  type: TicketType;

  @OneToMany(() => DailyTaskProgressEntity, daily => daily.ticket)
  dailyTaskProgresses: DailyTaskProgressEntity[];
}
