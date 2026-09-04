import { StringUtils } from '@libs/common/utils';
import { HEADER_REQ_ID } from '@libs/constants/context.constant';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { ClientKafka } from '@nestjs/microservices';
import { Message, Producer, ProducerRecord } from '@nestjs/microservices/external/kafka.interface';
import { nanoid } from 'nanoid';
import { ClsService } from 'nestjs-cls';
import { Observable, from } from 'rxjs';
import { KAFKA_TOKEN } from './kafka.constant';
import { IKafkaProducerMessage } from './kafka.interface';

@Injectable()
export class KafkaService {
  private readonly _logger = new Logger(KafkaService.name);
  private readonly _producerOb: Observable<Producer>;

  public constructor(
    @Inject(KAFKA_TOKEN) private readonly _kafkaClient: ClientKafka,
    private readonly _clsService: ClsService,
  ) {
    this._producerOb = from(this._kafkaClient.connect());
  }

  public emit(topic: string, payload: IKafkaProducerMessage): void {
    const topicName = `${process.env.KAFKA_ENV}.${topic}`;
    const headers = {
      [HEADER_REQ_ID]: this._clsService.getId() ?? nanoid(),
      ...(payload['headers'] ?? {}),
    };
    const messageValue = payload['value'];
    const message: Message = {
      key: payload['key'],
      value: StringUtils.isString(messageValue) ? (messageValue as string) : JSON.stringify(messageValue),
      headers,
    };

    const record: ProducerRecord = {
      topic: topicName,
      messages: [message],
      acks: -1,
    };

    const sub = this._producerOb.subscribe({
      next: producer =>
        producer.send(record).catch(e => this._logger.error(`Producing msg to ${topicName} failed: ${e.message}`)),
      error: e => this._logger.error(`Producing msg to ${topicName} failed: ${e.message}`),
      complete: () => {
        this._logger.log(
          `Produced msg to ${topicName}: ${JSON.stringify({
            key: message.key,
            headers: message.headers,
          })}`,
        );
        sub.unsubscribe();
      },
    });
  }

  public sendMessages(topic: string, messages: IKafkaProducerMessage[]): void {
    const topicName = `${process.env.KAFKA_ENV}.${topic}`;
    const headers = {
      [HEADER_REQ_ID]: this._clsService.getId() ?? nanoid(),
    };

    const record: ProducerRecord = {
      topic: topicName,
      messages: messages.map(item => ({
        key: item['key'] || null,
        value: StringUtils.isString(item['value']) ? (item['value'] as string) : JSON.stringify(item['value']),
        headers,
      })),
      acks: -1,
    };

    const sub = this._producerOb.subscribe({
      next: producer =>
        producer.send(record).catch(e => this._logger.error(`Producing msg to ${topicName} failed: ${e.message}`)),
      error: e => this._logger.error(`Producing msg to ${topicName} failed: ${e.message}`),
      complete: () => {
        this._logger.log(
          `Produced msg to ${topicName}: ${JSON.stringify({
            ...record.messages.map(message => ({ key: message.key, headers: message.headers })),
          })}`,
        );
        sub.unsubscribe();
      },
    });
  }
}
