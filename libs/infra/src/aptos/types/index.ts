import { MoveObjectType } from '@aptos-labs/ts-sdk';

export type AptosEventType<T> = {
  sequenceNumber: number;
  creationNumber: number;
  accountAddress: string;
  transactionVersion: string;
  transactionBlockHeight: number;
  type: string;
  from: string;
  entryFunctionIdStr: string;
  entryFunctionPayload: string;
  moduleAddress: string;
  moduleName: string;
  eventName: string;
  data: T;
  insertedAt: number;
  eventIndex: number;
  indexedType: string;
};

export type MoveObject = {
  inner: MoveObjectType;
};
