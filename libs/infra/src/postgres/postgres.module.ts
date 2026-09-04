import { EEnvKey } from '@libs/constants/env.constant';
import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PostgresConnectionOptions } from 'typeorm/driver/postgres/PostgresConnectionOptions';
import { entities } from './entities';
import * as repositories from './repositories';

@Global()
@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService): PostgresConnectionOptions => {
        return {
          type: configService.get(EEnvKey.DB_TYPE) || 'postgres',
          host: configService.get(EEnvKey.DB_HOST),
          port: configService.get(EEnvKey.DB_PORT),
          username: configService.get(EEnvKey.DB_USER),
          password: configService.get(EEnvKey.DB_PASSWORD),
          database: configService.get(EEnvKey.DB_DATABASE),
          dropSchema: false,
          logging: false,
          entities: entities,
          extra: {
            // based on https://node-postgres.com/apis/pool
            // max connection pool size
            max: configService.get(EEnvKey.DB_MAX_CONNECTION) || 20,
          },
        };
      },
    }),
    TypeOrmModule.forFeature(entities),
  ],
  providers: [...Object.values(repositories)],
  exports: [TypeOrmModule, ...Object.values(repositories)],
})
export class PostgresModule {}
