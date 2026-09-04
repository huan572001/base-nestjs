import { Module } from '@nestjs/common';
import { HyperionIndexerService } from './hyperion-indexer.service';
import { HttpModule, HYPERION_INDEXER_HTTP_TOKEN, IHttpServiceOptions } from '@libs/infra/http';
import { ConfigService } from '@nestjs/config';
import { EEnvKey } from '@libs/constants/env.constant';
import { AptosModule } from '@libs/infra/aptos';
import { AptosIndexerModule } from '../aptos-indexer/aptos-indexer.module';

@Module({
  imports: [
    HttpModule.forRoot([
      {
        provide: HYPERION_INDEXER_HTTP_TOKEN,
        useFactory: (config: ConfigService): IHttpServiceOptions => ({
          baseURL: config.get<string>(EEnvKey.HYPERION_INDEXER_URL),
          timeout: config.get<number>('HYPERION_API_TIMEOUT', 20000),
        }),
        inject: [ConfigService],
      },
    ]),
    AptosModule,
    AptosIndexerModule,
  ],
  providers: [HyperionIndexerService],
  exports: [HyperionIndexerService],
})
export class HyperionIndexerModule {}
