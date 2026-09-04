import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ClsModule } from 'nestjs-cls';

import { HEADER_REQ_ID } from '@libs/constants/context.constant';
import { nanoid } from 'nanoid';
import { getKafkaConfig } from './config';
import { KAFKA_TOKEN } from './kafka.constant';
import { KafkaService } from './kafka.service';

@Module({
  imports: [
    ClsModule.forRoot({
      global: true,
      middleware: {
        mount: false,
        saveReq: true,
        generateId: true,
        idGenerator: (req: Request) => {
          return req.headers[HEADER_REQ_ID] ?? nanoid();
        },
      },
    }),
    ClientsModule.registerAsync([
      {
        imports: [ConfigModule],
        name: KAFKA_TOKEN,
        inject: [ConfigService],
        useFactory: async (configService: ConfigService) => {
          const kafkaConfig = getKafkaConfig(configService);

          return {
            name: KAFKA_TOKEN,
            transport: Transport.KAFKA,
            options: kafkaConfig,
          };
        },
      },
    ]),
  ],
  providers: [KafkaService],
  exports: [KafkaService],
})
export class KafkaModule {}
