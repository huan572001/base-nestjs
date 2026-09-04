import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, Unique } from 'typeorm';
import BaseEntity from './base.entity';
import { TicketEntity } from './ticket.entity';

export interface TaskStatus {
  joinTelegramChannel: boolean;
  joinTelegramGroup: boolean;
  shareReferralLink: number;
  deposit: number;
  checkIn: boolean;
  checkOutX: boolean;
}

@Entity({ name: 'daily_task_progress' })
@Unique(['day', 'walletAddress'])
export class DailyTaskProgressEntity extends BaseEntity {
  @PrimaryGeneratedColumn()
  public id: number;

  @Column({ type: 'bigint', name: 'day' })
  day: number;

  @Column({ type: 'varchar', name: 'wallet_address' })
  walletAddress: string;

  @Column({ type: 'boolean', name: 'is_done', default: false })
  isDone: boolean;

  @Column({ type: 'json', name: 'tasks' })
  tasks: TaskStatus;
  @ManyToOne(() => TicketEntity, ticket => ticket.dailyTaskProgresses, { nullable: true })
  @JoinColumn({ name: 'ticket_id' })
  ticket?: TicketEntity;

  @Column({ type: 'int', name: 'ticket_id', nullable: true })
  ticketId?: number;
}
