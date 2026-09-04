import { Injectable } from '@nestjs/common';
import { Logger as LoggerOrm, QueryRunner } from 'typeorm';
import { LoggerService as NestjsLoggerService } from '@nestjs/common';
import { configure, getLogger, Appender, Layout, Logger as FourLogger } from 'log4js';
import { ClsServiceManager } from 'nestjs-cls';
import { ELogLevel } from '@libs/constants/mixins.enum';
const log4js = require('log4js');

const layouts: Record<string, Layout> = {
  console: {
    type: 'pattern',
    pattern: '%[%-6p %d [%c] | %m%]',
  },
  dateFile: {
    type: 'pattern',
    pattern: '%-6p %d [%c] | %m',
  },
  access: {
    type: 'pattern',
    pattern: '%[%-6p %d [%c] | rid:%x{rid} ip:%x{remoteAddr} %x{access}%]',
    tokens: {
      rid: function (logEvent) {
        let rid = logEvent.data.toString().split(' ', 1).pop();
        rid = rid.replace(/^.*:/, '');
        return rid;
      },
      remoteAddr: function (logEvent) {
        let remoteAddr = logEvent.data.toString().split(' ', 2).pop();
        remoteAddr = remoteAddr.replace(/^.*:/, '');
        remoteAddr = remoteAddr === '1' ? '127.0.0.1' : remoteAddr;
        return remoteAddr;
      },
      access: function (logEvent) {
        const [, ...data] = logEvent.data.toString().split(' ');
        data.pop();
        return data.join(' ');
      },
    },
  },
};

log4js.addLayout('json', function (config) {
  return function (logEvent) {
    return JSON.stringify(logEvent) + config.separator;
  };
});

const appenders: Record<string, Appender> = {
  console: {
    type: 'console',
    layout: layouts.console,
  },
  consoleBasic: {
    type: 'console',
    layout: { type: 'json', separator: '' },
  },
  dateFile: {
    type: 'dateFile',
    filename: 'logs/out.log',
    pattern: '-yyyy-MM-dd',
    layout: layouts.dateFile,
  },
  access: {
    type: 'console',
    layout: layouts.access,
  },
  accessBasic: {
    type: 'console',
    layout: { type: 'json', separator: '' },
  },
  dateFileAccess: {
    type: 'dateFile',
    filename: 'logs/out.log',
    pattern: '-yyyy-MM-dd',
    layout: layouts.access,
  },
  multi: {
    type: 'multiFile',
    base: 'logs/',
    property: 'categoryName',
    extension: '.log',
  },
};

class DbLogger implements LoggerOrm {
  constructor(private logger: FourLogger) {}

  /**
   * Logs query and parameters used in it.
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  logQuery(query: string, parameters?: any[], queryRunner?: QueryRunner): any {
    this.logger.addContext('rid', ClsServiceManager.getClsService().getId());
    this.logger.debug(`query=${query}` + (parameters ? ` parameters=${JSON.stringify(parameters)}` : ``));
  }

  /**
   * Logs query that is failed.
   */
  logQueryError(
    error: any,
    query: string,
    parameters?: any[],
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    queryRunner?: QueryRunner,
  ): any {
    this.logger.addContext('rid', ClsServiceManager.getClsService().getId());
    this.logger.debug(error);
    const errorMessage = error.message ? error.message : error;
    this.logger.error(errorMessage);
    this.logger.error(`query=${query} parameters=${JSON.stringify(parameters)}`);
  }

  /**
   * Logs query that is slow.
   */
  logQuerySlow(
    time: number,
    query: string,
    parameters?: any[],
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    queryRunner?: QueryRunner,
  ): any {
    this.logger.addContext('rid', ClsServiceManager.getClsService().getId());
    //TODO: Notify in developer check
    this.logger.debug(`Time = ${time}ms query=${query} parameters=${JSON.stringify(parameters)}`);
  }

  /**
   * Logs events from the schema build process.
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  logSchemaBuild(message: string, queryRunner?: QueryRunner): any {
    this.logger.addContext('rid', ClsServiceManager.getClsService().getId());
    this.logger.info(message);
  }

  /**
   * Logs events from the migrations run process.
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  logMigration(message: string, queryRunner?: QueryRunner): any {
    this.logger.info(message);
  }

  /**
   * Perform logging using given logger, or by default to the console.
   * Log has its own level and message.
   */
  log(
    level: 'log' | 'info' | 'warn',
    message: any,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    queryRunner?: QueryRunner,
  ): any {
    this.logger[level](message);
  }
}

export class LoggerAccess {
  private logger: FourLogger;
  constructor() {
    this.logger = getLogger('access');
  }
  public info(...args: any[]) {
    this.logger.addContext('rid', ClsServiceManager.getClsService().getId());
    this.logger.info(args);
  }
}

@Injectable()
export class LoggerService {
  /**
   * config logging
   * @example
   * Import Logging module
   * constructor(protected loggingService: LoggingService) {}
   * logger = this.loggingService.getLogger('serviceA');
   */
  constructor() {
    const level = process.env.LOG_LEVEL || ELogLevel.INFO;
    const isLogWithColor = process.env.LOG_COLOR === 'true';
    // const isWriteLog = false;
    configure({
      appenders: appenders,
      categories: {
        default: {
          appenders: isLogWithColor ? ['console'] : ['consoleBasic'],
          level: level,
          enableCallStack: true,
        },
        access: {
          appenders: isLogWithColor ? ['access'] : ['accessBasic'],
          level: 'info',
          enableCallStack: true,
        },
      },
    });
  }

  getLogger = getLogger;

  private _access = () => {
    const logger = new LoggerAccess();
    return {
      write: logger.info.bind(logger),
    };
  };

  logger = {
    default: getLogger('default'),
    access: this._access(),
  };

  getDbLogger(category: string) {
    return new DbLogger(this.getLogger(category));
  }
}
export class Logger implements NestjsLoggerService {
  private logger: FourLogger;
  constructor(category: string) {
    this.logger = new LoggerService().getLogger(category);
  }
  info(...args: any[]) {
    this.logger.addContext('rid', ClsServiceManager.getClsService().getId());
    this.logger.info(args);
  }
  debug(...args: any[]) {
    this.logger.addContext('rid', ClsServiceManager.getClsService().getId());
    this.logger.debug(`rid:${ClsServiceManager.getClsService().getId()}`, ...args);
  }
  error(...args: any[]) {
    this.logger.addContext('rid', ClsServiceManager.getClsService().getId());
    this.logger.error(`rid:${ClsServiceManager.getClsService().getId()}`, ...args);
  }
  warn(...args: any[]) {
    this.logger.addContext('rid', ClsServiceManager.getClsService().getId());
    this.logger.warn(`rid:${ClsServiceManager.getClsService().getId()}`, ...args);
  }

  log(...args: any[]) {
    this.logger.addContext('rid', ClsServiceManager.getClsService().getId());
    this.logger.info(`rid:${ClsServiceManager.getClsService().getId()}`, ...args);
  }
}
