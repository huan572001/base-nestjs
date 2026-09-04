import { MoveObject } from '@libs/infra/aptos';

export interface ICreateTradingPost {
  user1: string;
  user2: string;
  nfts1: MoveObject[];
  nfts2: MoveObject[];
  aptAmount1: string;
  aptAmount2: string;
  isLiveTrading: boolean;
  transactionVersion: string;
}

export interface IGetNewsfeed {
  userId: number;
  isFollowing: boolean;
}
