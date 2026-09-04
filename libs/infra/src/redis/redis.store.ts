import Redis, { RedisOptions } from 'ioredis';

export class RedisStore {
  public static create(url: string, options: RedisOptions): Redis {
    return new Redis(url, options);
  }
}
