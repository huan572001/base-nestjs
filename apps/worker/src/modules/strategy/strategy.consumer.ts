import { EventPatternAndLog } from '@libs/common/decorator';
import { KAFKA_TOPIC } from '@libs/infra/kafka';
import { CDCEventBase, CDCEventMessage } from '@libs/infra/kafka/events/cdc.event';
import { Controller } from '@nestjs/common';
import { Ctx, KafkaContext, Payload } from '@nestjs/microservices';
import { POOL_CREATED_EVENT, COLLECT_FEES_AND_REWARDS_EVENT } from './events';
import { StrategyService } from './strategy.service';
import { WITHDRAW_REWARDS_EVENT } from './events/withdraw-reward.event';
import { TransactionType } from '@libs/infra/postgres/entities/transaction-events.entity';
import { WITHDRAW_EVENT } from './events/withdraw.event';
import { PointService } from '@api/modules/point/point.service';
import { DEPOSIT_EVENT } from './events/deposit.event';
import { TICKET_MINT_EVENT } from './events/mint-ticket.event';

@Controller()
export class StrategyConsumer {
  constructor(
    private readonly strategyService: StrategyService,
    private readonly pointService: PointService,
  ) {}

  @EventPatternAndLog(KAFKA_TOPIC.SNAXFI)
  async handleTradingEvent(
    @Payload() event: CDCEventMessage<any>,
    /* eslint-disable @typescript-eslint/no-unused-vars */
    @Ctx() _context: KafkaContext,
  ) {
    const eventPayload = new CDCEventBase(event);
    switch (eventPayload.getEventName()) {
      case POOL_CREATED_EVENT:
        this.strategyService.handlePoolCreatedEvent(eventPayload.getData());
        break;
      case COLLECT_FEES_AND_REWARDS_EVENT:
        this.strategyService.handleCollectFeesAndRewardsEvent(eventPayload.getData(), eventPayload.getTxVersion());
        break;
      case DEPOSIT_EVENT:
        await this.strategyService.handleAddLiquidityOrWithdrawEvent(
          eventPayload.getData(),
          eventPayload.getAfter().from,
          Number(eventPayload.getTxVersion()),
          TransactionType.DEPOSIT,
          eventPayload.getAfter().insertedAt,
        );
        await this.pointService.updatePointsForUser(eventPayload.getAfter().from);
        break;
      case WITHDRAW_REWARDS_EVENT:
        await this.strategyService.handleWithdrawRewardEvent(
          eventPayload.getData(),
          Number(eventPayload.getTxVersion()),
          eventPayload.getAfter().insertedAt,
        );
        break;
      case WITHDRAW_EVENT:
        await this.strategyService.handleAddLiquidityOrWithdrawEvent(
          eventPayload.getData(),
          eventPayload.getAfter().from,
          Number(eventPayload.getTxVersion()),
          TransactionType.WITHDRAW,
          eventPayload.getAfter().insertedAt,
        );
        await this.pointService.updatePointsForUser(eventPayload.getAfter().from);
        break;
      default:
        break;
    }
  }
  @EventPatternAndLog(KAFKA_TOPIC.SNAXFI_V1)
  async handleTradingEventV1(
    @Payload() event: CDCEventMessage<any>,
    /* eslint-disable @typescript-eslint/no-unused-vars */
    @Ctx() _context: KafkaContext,
  ) {
    const eventPayload = new CDCEventBase(event);
    switch (eventPayload.getEventName()) {
      case TICKET_MINT_EVENT:
        this.strategyService.updateTicketedClaim(eventPayload.getData());
        break;
      default:
        break;
    }
  }
}
