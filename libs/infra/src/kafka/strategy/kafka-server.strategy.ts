import { HEADER_REQ_ID } from '@libs/constants/context.constant';
import { ServerKafka } from '@nestjs/microservices';
import {
  Consumer,
  EachMessagePayload,
  KafkaMessage,
  TopicPartitionOffsetAndMetadata,
} from '@nestjs/microservices/external/kafka.interface';
import { nanoid } from 'nanoid';
import { CLS_ID, ClsServiceManager } from 'nestjs-cls';

export class KafkaServerStrategy extends ServerKafka {
  private uncommittedOffsets: (TopicPartitionOffsetAndMetadata & { total: number })[] = [];

  public async handleMessage(payload: EachMessagePayload): Promise<void> {
    const { topic, partition, message } = payload;

    const rawMessage = this.parser.parse<KafkaMessage>(message);
    const requestId = rawMessage.headers[HEADER_REQ_ID] || nanoid();
    const user = rawMessage.headers['actor'] || rawMessage.value['actor'] || null;
    const offset = rawMessage.offset;

    // set cls user
    const cls = ClsServiceManager.getClsService();
    cls.enter();
    cls.set(CLS_ID, requestId);
    cls.set('user', user);

    this.logger.log(`[KafkaConsumedMessage]: topic:${topic}|p:${partition}|offset:${offset}`);

    const latest = this.uncommittedOffsets.find(e => e.topic === payload.topic && e.partition === payload.partition);
    if (latest) {
      latest.offset = `${parseInt(payload.message.offset) + 1}`;
      latest.total += 1;
    } else {
      this.uncommittedOffsets.push({
        topic: payload.topic,
        partition: payload.partition,
        offset: `${parseInt(payload.message.offset) + 1}`,
        total: 1,
      });
    }

    return super.handleMessage(payload);
  }

  public async bindEvents(consumer: Consumer): Promise<void> {
    consumer.on('consumer.commit_offsets', () => {
      this.uncommittedOffsets = [];
    });
    consumer.on('consumer.rebalancing', async () => {
      this.logger.log(`Manual commit on rebalancing ${JSON.stringify(this.uncommittedOffsets)}`);
      await consumer.commitOffsets(this.uncommittedOffsets);
    });
    await super.bindEvents(consumer);
  }
}
