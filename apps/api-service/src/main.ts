import '@libs/common/extension';
import { ResponseTransformInterceptor } from '@libs/common/interceptors';
import { LoggerService } from '@libs/common/loggers';
import { initSwagger } from '@libs/common/swagger';
import { EEnvKey } from '@libs/constants/env.constant';
import { VersioningType } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { SetupBullBoard } from 'libs/common/src/bull-board';
import { HttpExceptionFilter, UnknownExceptionsFilter, useMorgan } from 'libs/common/src/middleware';
import { BodyValidationPipe } from 'libs/common/src/pipes';
import { HEADER_REQ_ID } from 'libs/constants/src/context.constant';
import { nanoid } from 'nanoid';
import { ClsMiddleware } from 'nestjs-cls';
import 'source-map-support/register';
import { AppModule } from './app.module';

async function bootstrap() {
  const loggingService = new LoggerService();
  const app = await NestFactory.create<NestExpressApplication>(AppModule, { logger: loggingService.logger.default });
  const configService = app.get(ConfigService<any>);
  const logger = loggingService.getLogger('Main');

  SetupBullBoard(app, configService);
  app.use(
    new ClsMiddleware({
      generateId: true,
      idGenerator: (req: Request) => {
        const rid = req.headers[HEADER_REQ_ID] ?? nanoid();
        req['rid'] = rid;
        return rid;
      },
    }).use,
  );
  app.useGlobalInterceptors(new ResponseTransformInterceptor());
  app.useGlobalFilters(new UnknownExceptionsFilter(loggingService));
  app.useGlobalFilters(new HttpExceptionFilter());

  app.useGlobalPipes(new BodyValidationPipe());
  app.setGlobalPrefix(configService.get<string>(EEnvKey.GLOBAL_PREFIX));
  app.enableVersioning({
    type: VersioningType.URI,
  });
  app.enableCors();
  app.use(useMorgan(loggingService.logger.access));
  initSwagger(app, configService);

  await app.listen(configService.get<number>(EEnvKey.APP_PORT) || 5000);
  logger.info(`Application is running on: ${await app.getUrl()}`);
}

(async (): Promise<void> => bootstrap())();
