import '@libs/common/extension';
import { EEnvKey } from '@libs/constants/env.constant';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { getKafkaConfig } from '@libs/infra/kafka/config/kafka.config';
import { KafkaOptions, Transport } from '@nestjs/microservices';
import { WorkerModule } from './worker.module';

async function bootstrap() {
  const app = await NestFactory.create(WorkerModule);

  const configService = app.get<ConfigService>(ConfigService);
  const defaultConfig = getKafkaConfig(configService);

  app.connectMicroservice<KafkaOptions>(
    {
      transport: Transport.KAFKA,
      options: {
        client: defaultConfig.client,
        consumer: defaultConfig.consumer,
        run: defaultConfig.run,
        subscribe: defaultConfig.subscribe,
      },
    },
    {
      inheritAppConfig: true,
    },
  );
  app.startAllMicroservices();

  await app.listen(configService.get(EEnvKey.APP_PORT) || 3000);
}
bootstrap();
