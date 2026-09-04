import { ConfigurationModule } from '@libs/common/config';
import { LoggingModule } from '@libs/common/loggers';
import { ENodeEnv } from '@libs/constants/mixins.enum';
import { AptosModule } from '@libs/infra/aptos';
import { PostgresModule } from '@libs/infra/postgres/postgres.module';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { SentryModule } from '@ntegral/nestjs-sentry';
import * as Sentry from '@sentry/node';
import { ProfilingIntegration } from '@sentry/profiling-node';
import { ClsModule } from 'nestjs-cls';
import { MODULES } from './modules';
import { WorkerController } from './worker.controller';
import { WorkerService } from './worker.service';
import { ScheduleModule } from '@nestjs/schedule';
import { RedisModule } from '@libs/infra/redis';
import { EEnvKey } from '@libs/constants/env.constant';

@Module({
  imports: [
    PostgresModule,
    ClsModule.forRoot({
      global: true,
    }),
    SentryModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (config: ConfigService) => ({
        dsn: config.get<string>('SENTRY_DSN', ''),
        environment: config.get<string>('NODE_ENV', ENodeEnv.DEVELOPMENT),
        enabled: config.get<string>('SENTRY_DSN_IS_ENABLE', 'false') === 'true',
        integrations: [new Sentry.Integrations.Http({ tracing: true }), new ProfilingIntegration()],
        tracesSampleRate: config.get<string>('NODE_ENV') === ENodeEnv.DEVELOPMENT ? 1.0 : 0.5,
        profilesSampleRate: config.get<string>('NODE_ENV') === ENodeEnv.DEVELOPMENT ? 1.0 : 0.5,
      }),
      inject: [ConfigService],
    }),
    ConfigurationModule,
    LoggingModule,
    AptosModule.forRoot(),
    ScheduleModule.forRoot(),
    RedisModule.registerAsync({
      useFactory: async (configService: ConfigService) => {
        return {
          url: configService.get<string>(EEnvKey.REDIS_URL),
        };
      },
      inject: [ConfigService],
    }),
    ...MODULES,
  ],
  controllers: [WorkerController],
  providers: [WorkerService],
})
export class WorkerModule {}
