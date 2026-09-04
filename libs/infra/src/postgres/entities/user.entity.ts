import { Column, Entity, PrimaryGeneratedColumn, Unique } from 'typeorm';
import BaseEntity from './base.entity';

@Entity({ name: 'users' })
@Unique(['walletAddress'])
@Unique(['telegramId'])
@Unique(['refCode'])
@Unique(['userIdSocial'])
export class UserEntity extends BaseEntity {
  @PrimaryGeneratedColumn()
  public id: number;

  @Column({ type: 'varchar', name: 'wallet_address' })
  walletAddress: string;

  @Column({ type: 'varchar', name: 'ref_code', nullable: true })
  refCode: string;

  @Column({ type: 'varchar', name: 'ref_by', nullable: true })
  refBy: string;

  @Column({ type: 'varchar', name: 'telegram_id', nullable: true })
  telegramId: string;

  @Column({ type: 'varchar', name: 'user_id_social', nullable: true })
  userIdSocial: string;
}

export class UserPayload {
  id: number;
  walletAddress: string;
}
