import { AptosModule } from '@libs/infra/aptos';
import { HttpException, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { SentryInterceptor, SentryModule } from '@ntegral/nestjs-sentry';
import * as Sentry from '@sentry/node';
import { ProfilingIntegration } from '@sentry/profiling-node';
import { ConfigurationModule } from 'libs/common/src/config';
import { LoggingModule } from 'libs/common/src/loggers';
import { ENodeEnv } from 'libs/constants/src/mixins.enum';
import { PostgresModule } from 'libs/infra/src/postgres/postgres.module';
import { ClsModule } from 'nestjs-cls';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MODULES } from './modules';
import { EEnvKey } from '@libs/constants/env.constant';
import { RedisModule } from '@libs/infra/redis';

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
    EventEmitterModule.forRoot({
      maxListeners: 30,
    }),
    AptosModule.forRoot(),
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
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_INTERCEPTOR,
      useFactory: () =>
        new SentryInterceptor({
          filters: [
            {
              type: HttpException,
              filter: (exception: HttpException) => 500 > exception.getStatus(),
            },
          ],
        }),
    },
  ],
})
export class AppModule {}
