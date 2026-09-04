import { Module } from '@nestjs/common';
import { TicketRepository } from 'libs/infra/src/postgres/repositories';

import { TicketService } from './ticket.service';
import { TicketController } from './ticket.controller';

@Module({
  imports: [],
  controllers: [TicketController],
  providers: [TicketService, TicketRepository],
  exports: [TicketService],
})
export class TicketModule {}
