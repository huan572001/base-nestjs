export const WITHDRAW_EVENT = 'WithdrawEvent';

export type WithdrawEventPayload = {
  poolId: string;
  amountA: string;
  amountB: string;
  lpSupply: string;
  deltaLiquidity: string;
};
