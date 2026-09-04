import { EventPattern, KafkaContext } from '@nestjs/microservices';
import * as Sentry from '@sentry/node';
import { Logger } from '../loggers/logger.service';

export function EventPatternAndLog(topicName: string, prefix = null): MethodDecorator {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor): void {
    const originalHandler = descriptor.value;
    const className = target.constructor.name;
    const logger = new Logger(className);

    descriptor.value = async function (data: any, context: KafkaContext): Promise<any> {
      const message = context.getMessage();
      const { offset } = message;
      const topic = context.getTopic();
      const partition = context.getPartition();

      try {
        logger.log(`EventPattern start: ${JSON.stringify({ topic, partition, offset })}`);
        const response = await originalHandler.call(this, data, context);
        logger.log(`EventPattern done: ${JSON.stringify({ topic, partition, offset })}`);
        return response;
      } catch (error) {
        logger.error(
          `EventPattern error: ${JSON.stringify({
            topic,
            partition,
            offset,
            error: error.message,
            stack: error.stack,
          })}`,
        );
        Sentry.captureException(error);
      }
    };
    if (prefix) {
      EventPattern(`${process.env.KAFKA_ENV}.${prefix}.${topicName}`)(target, propertyKey, descriptor);
    } else {
      EventPattern(`${process.env.KAFKA_ENV}.${topicName}`)(target, propertyKey, descriptor);
    }
  };
}
