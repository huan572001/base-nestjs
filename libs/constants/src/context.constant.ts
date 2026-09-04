export const HEADER_LANGUAGE = 'x-lang';
export const HEADER_REQ_ID = 'x-request-id';
export const HEADER_VERSION_KEY = 'x-version-id';
export const HEADER_API_KEY = 'x-api-key';
export const COMPOUND_INTEREST = 365;
export const REPEAT_INTERVAL = 3;
export enum ENV {
  PRODUCTION = 'production',
  RELEASE = 'release',
  STAGING = 'staging',
  DEVELOPMENT = 'development',
  TEST = 'test',
  LOCAL = 'local',
}

export const IS_LOCAL = process.env.NODE_ENV === ENV.LOCAL;
