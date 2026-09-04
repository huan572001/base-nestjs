import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import * as Joi from 'joi';
import { EEnvKey } from 'libs/constants/src/env.constant';

@Global()
@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: `.env`,
      validationSchema: Joi.object({
        [EEnvKey.NODE_ENV]: Joi.string().valid('development', 'staging', 'production'),
        [EEnvKey.GLOBAL_PREFIX]: Joi.string(),
        [EEnvKey.SWAGGER_PATH]: Joi.string(),
        [EEnvKey.SENTRY_DSN_IS_ENABLE]: Joi.string(),
        [EEnvKey.JWT_ACCESS_SECRET_KEY]: Joi.string(),
        [EEnvKey.JWT_REFRESH_SECRET_KEY]: Joi.string(),
      }),
      load: [],
    }),
  ],
  providers: [ConfigService],
  exports: [ConfigService],
})
export class ConfigurationModule {}
