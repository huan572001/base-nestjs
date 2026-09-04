import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis, { Cluster } from 'ioredis';
import { StringUtils } from 'libs/common/src/utils';
import { REDIS_STORE_INSTANCE_TOKEN } from 'libs/infra/src/redis/redis.constant';

@Injectable()
export class RedisService {
  protected readonly _logger = new Logger(RedisService.name);
  public constructor(
    @Inject(REDIS_STORE_INSTANCE_TOKEN)
    private readonly store: Cluster | Redis,
    private readonly _configService: ConfigService,
  ) {}

  private readonly _prefix = this.store.options.keyPrefix;

  public getClient(): Cluster | Redis {
    return this.store;
  }

  public async set(key: string, value: unknown, seconds?: number): Promise<'OK'> {
    let response;
    if (!seconds) {
      response = await this.store.set(key, JSON.stringify(value));
      this._logger.debug(`[CACHE] ${JSON.stringify({ method: 'SET', key, value })}`);
    } else {
      response = await this.store.set(key, JSON.stringify(value), 'EX', seconds);
      this._logger.debug(`[CACHE] ${JSON.stringify({ method: 'SET', key, value, seconds })}`);
    }

    return response;
  }

  public async setExpire(key: string, seconds: number): Promise<number> {
    const response = await this.store.expire(key, seconds);
    this._logger.debug(`[CACHE] ${JSON.stringify({ method: 'EXPIRE', key, seconds, response })}`);
    return response;
  }

  public async setNxEx(key: string, value: unknown, seconds = 1000): Promise<boolean> {
    const setNxResult = await this.store.setnx(key, JSON.stringify(value));
    this._logger.debug(`[CACHE] ${JSON.stringify({ method: 'SETNX', key, value, result: setNxResult })}`);
    if (setNxResult === 1) {
      await this.store.expire(key, seconds);
    }
    return !!setNxResult;
  }

  public async setList(key: string, value: any[], expireTime = 1000): Promise<number> {
    const response = await this.store.lpush(key, ...value);
    await this.store.expire(key, expireTime);
    return response;
  }

  public async getListLength(key: string): Promise<number> {
    return this.store.llen(key);
  }

  public async get<T>(key: string): Promise<T> {
    const result = await this.store.get(key);
    this._logger.debug(`[CACHE] ${JSON.stringify({ method: 'GET', key, result })}`);
    try {
      return StringUtils.isJson(result) ? (JSON.parse(result) as T) : (result as unknown as T);
    } catch (e) {
      this._logger.error(e?.message);
      return null;
    }
  }

  public async hget<T>(key: string, field: string): Promise<T> {
    const result = await this.store.hget(key, field);
    this._logger.debug(`[CACHE] ${JSON.stringify({ method: 'HGET', key, field, result })}`);
    return result as unknown as T;
  }

  public async hgetall<T>(key: string): Promise<T> {
    try {
      const result = await this.store.hgetall(key);
      this._logger.debug(`[CACHE] ${JSON.stringify({ method: 'HGETALL', key, result })}`);
      return result as unknown as T;
    } catch (e) {
      this._logger.error(e?.message);
      return null;
    }
  }

  public async hmset(key: string, values: Record<string, unknown>): Promise<'OK'> {
    const result = await this.store.hmset(key, values);
    this._logger.debug(`[CACHE] ${JSON.stringify({ method: 'HMSET', key, values, result })}`);
    return result;
  }

  public async hdel(key: string, field: string): Promise<number> {
    const result = await this.store.hdel(key, field);
    this._logger.debug(`[CACHE] ${JSON.stringify({ method: 'HDEL', key, field, result })}`);
    return result;
  }

  public async hincrby(key: string, field: string, increment = 1): Promise<number> {
    const result = await this.store.hincrby(key, field, increment);
    this._logger.debug(`[CACHE] ${JSON.stringify({ method: 'HINCRBY', key, field, increment, result })}`);
    return result;
  }

  public hexists(key: string, field: string): Promise<number> {
    return this.store.hexists(key, field);
  }

  public async getSets(key: string): Promise<string[]> {
    const result = await this.store.smembers(key);
    this._logger.debug(`[CACHE] ${JSON.stringify({ method: 'SMEMBERS', key, result })}`);
    return result;
  }

  public async setSets(key: string, values: string[]): Promise<number> {
    const result = await this.store.sadd(key, ...values);
    this._logger.debug(`[CACHE] ${JSON.stringify({ method: 'SADD', key, values, result })}`);
    return result;
  }

  public async getSortedSet(key: string): Promise<string[]> {
    const result = await this.store.zrange(key, 0, -1);
    this._logger.debug(`[CACHE] ${JSON.stringify({ method: 'ZRANGE', key, result })}`);
    return result;
  }

  public async setSortedSet(key: string, values: Record<string, number>): Promise<number> {
    const valuesArr = Object.entries(values).reduce((acc, [value, score]) => {
      return [...acc, score, value];
    }, []);

    const result = await this.store.zadd(key, ...valuesArr);
    this._logger.debug(`[CACHE] ${JSON.stringify({ method: 'ZADD', key, values, result })}`);
    return result;
  }

  public async mget<T>(keys: string[]): Promise<T[]> {
    if (keys.length === 0) {
      return [] as T[];
    }
    const result = await this.store.mget(keys);
    this._logger.debug(`[CACHE] ${JSON.stringify({ method: 'MGET', keys, result })}`);
    try {
      return result
        .map(r => {
          return StringUtils.isJson(r) ? JSON.parse(r) : r;
        })
        .filter(r => !!r) as T[];
    } catch (e) {
      return [] as T[];
    }
  }

  public async del(key: string): Promise<number> {
    const result = await this.store.del(key);
    this._logger.debug(`[CACHE] ${JSON.stringify({ method: 'DEL', key, result })}`);
    return result;
  }

  public async reset(): Promise<'OK'> {
    return this.store.flushdb();
  }

  public async keys(pattern: string): Promise<string[]> {
    this._logger.debug(`[CACHE] ${JSON.stringify({ method: 'KEYS', pattern: `${this._prefix}${pattern}` })}`);
    return this.store.keys(`${this._prefix}${pattern}`);
  }

  public async existKey(key: string): Promise<boolean> {
    return (await this.store.exists(key)) === 1;
  }

  public async setJson<T>(key: string, value: T, path?: string, nx?: boolean): Promise<any> {
    return this.store.call(
      'JSON.SET',
      `${this._prefix}${key}`,
      `${path ? `$.${path}` : '$'}`,
      JSON.stringify(value),
      ...(nx ? ['NX'] : []),
    );
  }

  public async getJson<T>(key: string, path?: string): Promise<T> {
    const result = await this.store.call('JSON.GET', `${this._prefix}${key}`, `${path ? `$.${path}` : '$'}`);
    try {
      return JSON.parse(result as string)?.[0];
    } catch (e) {
      this._logger.error(e?.message);
      return null;
    }
  }

  public async mgetJson<T>(keys: string[]): Promise<T[]> {
    if (!keys?.length) {
      return [];
    }

    keys = keys.map(key => `${this._prefix}${key}`);

    const result = await this.store.call('JSON.MGET', ...keys, '$');
    return ((result as any[]) || []).filter(r => !!r).map(r => JSON.parse(r)?.[0]);
  }

  public async delPath(key: string, path: string): Promise<any> {
    return this.store.call('JSON.DEL', `${this._prefix}${key}`, `$.${path}`);
  }
}
