import { MoveObject } from '@libs/infra/aptos';

export interface ICreateTradingHistory {
  user1: string;
  user2: string;
  nfts1: MoveObject[];
  nfts2: MoveObject[];
  aptAmount1: string;
  aptAmount2: string;
  isLiveTrading: boolean;
  transactionVersion: string;
  roomId?: string;
}

export interface IUserTradingHistory {
  id: number;
  walletAddress: string;
  username: string;
  nfts: string[];
  aptAmount: string;
}

export interface ITradingHistory {
  id: number;
  user1: IUserTradingHistory;
  user2: IUserTradingHistory;
  isLiveTrading: boolean;
  transactionVersion: string;
  createdAt: Date;
  updatedAt: Date;
}
