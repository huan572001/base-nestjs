import { Aptos, AptosConfig, Network } from '@aptos-labs/ts-sdk';
import { EEnvKey } from '@libs/constants/env.constant';
import { APTOS_INSTANCE_TOKEN } from '@libs/infra/aptos/aptos.constant';
import { AptosService } from '@libs/infra/aptos/aptos.service';
import { DynamicModule, Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Global()
@Module({})
export class AptosModule {
  static forRoot(): DynamicModule {
    return {
      module: AptosModule,
      providers: [
        {
          provide: APTOS_INSTANCE_TOKEN,
          useFactory: (configService: ConfigService) => {
            const network = configService.get<Network>(EEnvKey.APTOS_NETWORK) || Network.TESTNET;
            return new Aptos(new AptosConfig({ network }));
          },
          inject: [ConfigService],
        },
        AptosService,
      ],
      exports: [AptosService, APTOS_INSTANCE_TOKEN],
    };
  }
}
