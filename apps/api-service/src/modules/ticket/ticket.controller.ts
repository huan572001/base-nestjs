import { Body, Controller, Get, Post, Put, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { TicketService } from './ticket.service';
import { SetClaimedTicketDto, SignDto } from './dtos/SetClaimedTicketDto';
import { GetTicketSummaryQueryDto } from './dtos/GetTicketSummaryDto';

@ApiTags('ticket')
@Controller({
  path: 'ticket',
  version: '1',
})
export class TicketController {
  constructor(private readonly ticketService: TicketService) {}

  @Get('/')
  getTicket(@Query('walletAddress') walletAddress: string) {
    return this.ticketService.getTicket(walletAddress);
  }

  @Post('/sign')
  signClaimTicket(@Body() body: SignDto) {
    return this.ticketService.signClaimTicket(body.walletAddress, body.ticketIds);
  }

  @Get('/summary')
  getTicketSummary(@Query() query: GetTicketSummaryQueryDto) {
    return this.ticketService.getCountTicketByType(query.walletAddress, query.type);
  }

  @Put('/claim')
  setClaimedTicket(@Body() body: SetClaimedTicketDto) {
    return this.ticketService.setClaimedTicket(body.ticketIds, body.walletAddress);
  }
}
