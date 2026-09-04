import { DynamicModule, Global, Logger, Module, Provider } from '@nestjs/common';

import { IRedisStoreModuleAsyncOptions, IRedisStoreModuleOptionsFactory, RedisStoreModuleOptions } from './interfaces';
import { RedisClusterStore } from './redis-cluster.store';
import { REDIS_STORE_INSTANCE_TOKEN, REDIS_STORE_MODULE_OPTIONS } from './redis.constant';
import { RedisService } from './redis.service';
import { RedisStore } from './redis.store';

@Global()
@Module({})
export class RedisModule {
  public static register(config: RedisStoreModuleOptions): DynamicModule {
    const store = config.clusterMode
      ? RedisClusterStore.create(config.nodes, config.clusterOptions)
      : RedisStore.create(config.url, config.redisOptions);

    store.on('connect', () => {
      Logger.log('Redis connected');
    });

    store.on('error', error => {
      Logger.error(error);
    });

    return {
      module: RedisModule,
      providers: [
        {
          provide: REDIS_STORE_INSTANCE_TOKEN,
          useValue: store,
        },
        RedisService,
      ],
      exports: [RedisService],
    };
  }

  public static registerAsync(options: IRedisStoreModuleAsyncOptions): DynamicModule {
    return {
      module: RedisModule,
      imports: options.imports,
      providers: [
        ...this._createAsyncProviders(options),
        {
          provide: REDIS_STORE_INSTANCE_TOKEN,
          // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
          useFactory: (config: RedisStoreModuleOptions) => {
            const store = config.clusterMode
              ? RedisClusterStore.create(config.nodes, config.clusterOptions)
              : RedisStore.create(config.url, config.redisOptions);

            store.on('connect', () => {
              Logger.log('Redis connected');
            });

            store.on('error', error => {
              Logger.error(error);
            });

            return store;
          },
          inject: [REDIS_STORE_MODULE_OPTIONS],
        },

        ...(options.extraProviders || []),
        RedisService,
      ],
      exports: [RedisService],
    };
  }

  private static _createAsyncProviders(options: IRedisStoreModuleAsyncOptions): Provider[] {
    if (options.useExisting || options.useFactory) {
      return [this._createAsyncOptionsProvider(options)];
    }
    return [
      this._createAsyncOptionsProvider(options),
      {
        provide: options.useClass,
        useClass: options.useClass,
      },
    ];
  }

  private static _createAsyncOptionsProvider(options: IRedisStoreModuleAsyncOptions): Provider {
    if (options.useFactory) {
      return {
        provide: REDIS_STORE_MODULE_OPTIONS,
        useFactory: options.useFactory,
        inject: options.inject || [],
      };
    }
    return {
      provide: REDIS_STORE_MODULE_OPTIONS,
      useFactory: async (optionsFactory: IRedisStoreModuleOptionsFactory) => optionsFactory.createRedisStoreOptions(),
      inject: [options.useExisting || options.useClass],
    };
  }
}
