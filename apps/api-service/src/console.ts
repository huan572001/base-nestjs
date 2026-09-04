require('dotenv').config();
import { BootstrapConsole } from 'nestjs-console';

import { ConsoleBaseModule } from './console.module';
import { Logger } from '@nestjs/common/services';

const logger = new Logger('console');
logger.log('Start console');

const bootstrap = new BootstrapConsole({
  module: ConsoleBaseModule,
  useDecorators: true,
  contextOptions: {
    logger: logger,
  },
});

bootstrap.init().then(async app => {
  try {
    await app.init();
    await bootstrap.boot();
    await app.close();
    process.exit(0);
  } catch (e) {
    console.error(e);
    await app.close();
    process.exit(1);
  }
});
