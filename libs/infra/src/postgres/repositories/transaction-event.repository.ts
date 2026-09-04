import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TransactionEventEntity } from '../entities/transaction-events.entity';
import { BaseRepository } from './base.repository';

@Injectable()
export class TransactionEventsRepository extends BaseRepository<TransactionEventEntity> {
  constructor(
    @InjectRepository(TransactionEventEntity)
    protected transactionEventRepository: Repository<TransactionEventEntity>,
  ) {
    super(transactionEventRepository);
  }
}
