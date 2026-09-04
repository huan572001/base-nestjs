import { ConfigService } from '@nestjs/config';
import {
  ConsumerConfig,
  ConsumerRunConfig,
  ConsumerSubscribeTopics,
  KafkaConfig,
  logLevel,
  ProducerConfig,
  ProducerRecord,
} from '@nestjs/microservices/external/kafka.interface';

export interface IKafkaConfig {
  env?: string;
  postfixId?: string;
  client?: KafkaConfig;
  consumer?: ConsumerConfig;
  run?: Omit<ConsumerRunConfig, 'eachBatch' | 'eachMessage'>;
  subscribe?: Omit<ConsumerSubscribeTopics, 'topics'>;
  producer?: ProducerConfig;
  send?: Omit<ProducerRecord, 'topic' | 'messages'>;
  producerOnlyMode?: boolean;
}

export const getKafkaConfig = (configService: ConfigService): IKafkaConfig => ({
  env: configService.get<string>('KAFKA_ENV'),
  client: {
    clientId: configService.get<string>('KAFKA_CLIENT_ID'),
    ssl: configService.get<string>('KAFKA_SSL_CA')
      ? {
          ca: configService.get<string>('KAFKA_SSL_CA'),
          key: configService.get<string>('KAFKA_SSL_KEY'),
          cert: configService.get<string>('KAFKA_SSL_CERT'),
        }
      : undefined,
    brokers: [configService.get<string>('KAFKA_BOOTSTRAP_SERVERS')],
    sasl: configService.get<string>('KAFKA_SASL_USERNAME')
      ? {
          mechanism: configService.get<any>('KAFKA_SASL_MECHANISM'),
          username: configService.get<string>('KAFKA_SASL_USERNAME'),
          password: configService.get<string>('KAFKA_SASL_PASSWORD'),
        }
      : undefined,
    connectionTimeout: 30000,
    logLevel: logLevel.INFO,
  },
  run: {
    partitionsConsumedConcurrently: parseInt(configService.get('KAFKA_CONSUMER_CONCURRENTLY')) || 100,
  },
  subscribe: {
    fromBeginning: configService.get<string>('KAFKA_CONSUMER_FROM_BEGINNING') === 'true' || false,
  },
  producer: {
    idempotent: true,
    // maxInFlightRequests: 1,
  },
  consumer:
    configService.get('KAFKA_PRODUCER_ONLY_MODE') !== 'true'
      ? {
          groupId: `$${configService.get('KAFKA_CONSUMER_GROUP_ID')}${
            configService.get('KAFKA_ENV') ? `-${configService.get('KAFKA_ENV')}` : ''
          }`,
          maxBytes: parseInt(configService.get('KAFKA_CONSUMER_MAX_BYTES')) || 10000,
        }
      : undefined,
  producerOnlyMode: configService.get('KAFKA_PRODUCER_ONLY_MODE') === 'true' || false,
});
