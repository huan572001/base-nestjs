export const WITHDRAW_REWARDS_EVENT = 'WithdrawRewardsEvent';

export type WithdrawRewardsEventPayload = {
  user: string;
  poolId: string;
  rewards: {
    data: {
      key: {
        inner: string;
      };
      value: string;
    }[];
  };
};
