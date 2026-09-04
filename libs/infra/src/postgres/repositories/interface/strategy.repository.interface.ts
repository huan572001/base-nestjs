export interface IStrategy {
  id: number;
  protocols: string[];
  stakeToken: string[];
  apy: string;
  totalValueLock: string;
  strategyType: string;
  displayName: string;
  managementFee: number;
  performanceFee: number;
  capacity: number;
  LPBreakdown: { assetToken: string; amount: number; value: number };
}
