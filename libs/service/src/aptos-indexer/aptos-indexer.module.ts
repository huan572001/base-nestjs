import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EEnvKey } from 'libs/constants/src/env.constant';
import { APTOS_INDEXER_HTTP_TOKEN, IHttpServiceOptions } from 'libs/infra/src/http';
import { HttpModule } from 'libs/infra/src/http/http.module';
import { AptosIndexerService } from 'libs/service/src/aptos-indexer/aptos-indexer.service';

@Module({
  imports: [
    HttpModule.forRoot([
      {
        provide: APTOS_INDEXER_HTTP_TOKEN,
        useFactory: (config: ConfigService): IHttpServiceOptions => ({
          baseURL: config.get<string>(EEnvKey.APTOS_INDEXER_URL),
          timeout: config.get<number>('APTOS_API_TIMEOUT', 20000),
          headers: {
            Authorization: `Bearer ${config.get<string>(EEnvKey.APTOS_API_KEY)}`,
          },
        }),
        inject: [ConfigService],
      },
    ]),
  ],
  providers: [AptosIndexerService],
  exports: [AptosIndexerService],
})
export class AptosIndexerModule {}
