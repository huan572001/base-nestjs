import { Module } from '@nestjs/common';
import { TransactionEventsController } from './transaction-event.controller';
import { TransactionEventsService } from './transaction-event.service';
import { TransactionEventsRepository } from '@libs/infra/postgres/repositories';

@Module({
  imports: [],
  controllers: [TransactionEventsController],
  providers: [TransactionEventsService, TransactionEventsRepository],
  exports: [TransactionEventsService],
})
export class TransactionEventsModule {}
