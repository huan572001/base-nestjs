import { EntryFunctionPayloadResponse } from '@aptos-labs/ts-sdk';
import { AptosEventType } from '@libs/infra/aptos';
import camelcaseKeys from 'camelcase-keys';

export type CDCEventMessage<T> = {
  before: AptosEventType<T>;
  after: AptosEventType<T>;
  op: 'c' | 'r' | 'u' | 'd';
  transaction?: any;
};

export interface CDCEventInterface {
  getBeforePayload<T extends CDCEventBase>(): T;
  getAfterPayload<T extends CDCEventBase>(): T;

  isCreateEvent(): boolean;
  isUpdateEvent(): boolean;
  isDeleteEvent(): boolean;
}

export class CDCEventBase<Payload extends CDCEventMessage<any> = CDCEventMessage<any>> {
  private _op: string;
  private _payload;
  private _before: AptosEventType<any>;
  private _after: AptosEventType<any>;
  private _eventName: string;
  private _data: any;
  private _transactionVersion: string;

  public constructor(payload: Payload) {
    this._payload = camelcaseKeys(payload, { deep: true });

    if (payload.before) {
      this._before = this._payload.before;
      this._eventName = this._before.eventName;
      this._data = this._before.data;
      this._transactionVersion = this._before.transactionVersion;
    }
    if (payload.after) {
      this._after = this._payload.after;
      this._eventName = this._after.eventName;
      this._data = this._after.data;
      this._transactionVersion = this._after.transactionVersion;
    }
    this._op = payload.op;
  }

  public getBefore(): Payload['before'] {
    return this._before;
  }

  public getAfter(): Payload['after'] {
    return this._after;
  }

  public getData<T>(): T {
    return camelcaseKeys(JSON.parse(this._data));
  }

  public getPayload(): EntryFunctionPayloadResponse {
    return camelcaseKeys(JSON.parse(this._after.entryFunctionPayload));
  }

  public getEventName(): string {
    return this._eventName;
  }

  public getTxVersion(): string {
    return this._transactionVersion;
  }

  public isCreateEvent(): boolean {
    return this._op === 'c';
  }

  public isSnapshotEvent(): boolean {
    return this._op === 'r';
  }

  public isUpdateEvent(): boolean {
    return this._op === 'u';
  }

  public isDeleteEvent(): boolean {
    return this._op === 'd';
  }
}
