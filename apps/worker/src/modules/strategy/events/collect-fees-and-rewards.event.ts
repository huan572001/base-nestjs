export const COLLECT_FEES_AND_REWARDS_EVENT = 'CollectFeesAndRewardsEvent';

type RewardsData = {
  key: {
    inner: string;
  };
  value: string;
};

export type CollectFeesAndRewardsEventPayload = {
  poolId: string;
  feeTokenAAmount: string;
  feeTokenBAmount: string;
  rewards: {
    data: RewardsData[];
  };
};
