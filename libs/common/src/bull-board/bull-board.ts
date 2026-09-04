// eslint-disable-next-line @typescript-eslint/no-var-requires
import { ConfigService } from '@nestjs/config';

import { INestApplication } from '@nestjs/common';
import Queue from 'bull';
import { BullAdapter } from '@bull-board/api/bullAdapter';
import { ExpressAdapter } from '@bull-board/express';
import { createBullBoard } from '@bull-board/api';
import expressBasicAuth from 'express-basic-auth';
import { EEnvKey } from '@libs/constants/env.constant';
import { QUEUES_CONFIG } from '@libs/constants/queue.constant';

export function SetupBullBoard(app: INestApplication, configService: ConfigService) {
  const bullBoardPath = '/bull-board';
  const queuesName = Object.values(QUEUES_CONFIG).map(queueConfig => queueConfig.QUEUE_NAME);
  const queues = queuesName.map(queueName => {
    const queue = new Queue(queueName, configService.get(EEnvKey.REDIS_URL));
    // TODO: change to false when production
    return new BullAdapter(queue, { readOnlyMode: false });
  });

  const serverAdapter = new ExpressAdapter();
  serverAdapter.setBasePath(bullBoardPath);

  createBullBoard({
    queues: queues,
    serverAdapter: serverAdapter,
    options: {
      uiConfig: {
        boardTitle: 'Admin',
      },
    },
  });
  app.use(
    bullBoardPath,
    expressBasicAuth({
      users: {
        admin: configService.get(EEnvKey.BASIC_AUTH_PASSWORD) || 'admin',
      },
      challenge: true,
    }),
    serverAdapter.getRouter(),
  );
}
