export const DEPOSIT_EVENT = 'DepositEvent';

export type DepositEventPayload = {
  user: string;
  poolId: string;
  amountA: string;
  amountB: string;
  lpAmount: string;
};
