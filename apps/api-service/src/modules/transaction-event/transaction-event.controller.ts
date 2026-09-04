import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { TransactionEventsService } from './transaction-event.service';
import { GetPnlByAddressAndPoolIdDto, GetPnlByAddressDto } from './dtos/get-transaction-event';

@ApiTags('transaction-events')
@Controller({
  path: 'transaction-events',
  version: '1',
})
export class TransactionEventsController {
  constructor(private readonly transactionEventsService: TransactionEventsService) {}

  @Get('/pnl-by-address-and-pool-id')
  async calculatePnl(@Query() query: GetPnlByAddressAndPoolIdDto) {
    return this.transactionEventsService.getPnlByAddressAndPoolId(query.address, query.poolId);
  }
  @Get('/pnl-by-address')
  async calculatePnlByAddress(@Query() query: GetPnlByAddressDto) {
    return this.transactionEventsService.getPnlByAddress(query.address);
  }
}
