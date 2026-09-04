import { AuthModule } from 'apps/api-service/src/modules/auth/auth.module';
import { UserModule } from 'apps/api-service/src/modules/user/user.module';
import { StrategyModule } from './strategy/strategy.module';
import { HistoryPositionModule } from './history-position/history-position.module';
import { DailyTaskProgressModule } from './daily-task-progress/daily-task-progress.module';
import { TicketModule } from './ticket/ticket.module';
import { PointModule } from './point/point.module';
import { TransactionEventsModule } from './transaction-event/transaction-event.module';
import { GraphqlModule } from './graphql/graphql.module';

export const MODULES = [
  AuthModule,
  UserModule,
  StrategyModule,
  HistoryPositionModule,
  DailyTaskProgressModule,
  TicketModule,
  PointModule,
  TransactionEventsModule,
  GraphqlModule,
];
