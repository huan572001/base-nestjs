export const POOL_CREATED_EVENT = 'PoolCreatedEvent';

export type PoolCreatedEventPayload = {
  clmmPool: {
    inner: string;
  };
  id: string;
  lpToken: {
    inner: string;
  };
  maxTvl: string;
  quoteAssetType: {
    vec: string[];
  };
  rebalanceThreshold: string;
  tickLower: number;
  tickRebalanceWidth: number;
  tickUpper: number;
};
