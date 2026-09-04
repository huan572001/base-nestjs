export interface IKafkaProducerMessage {
  key: string;
  value: string | Record<string, any>;
  headers?: Record<string, string>;
}

export interface IKafkaConsumerMessage<T> {
  topic: string;
  offset: string;
  partition: number;
  key: string;
  headers: {
    [key: string]: any;
  };
  value: T;
}
