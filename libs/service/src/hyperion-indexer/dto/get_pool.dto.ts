export const fetchPoolHyperion = () => `
    query queryPools {
        api {
        getPoolStat {
            feeAPR
            farmAPR
            pool {
            currentTick
            feeRate
            feeTier
            poolId
            senderAddress
            sqrtPrice
            token1
            token2
            token1Info {
                decimals
            }
            token2Info {
                decimals
            }
            }
        }
        }
    }
`;
export class FetchPoolHyperionDto {
  data: {
    api: {
      getPoolStat: PoolHyperion[];
    };
  };
}

export class PoolHyperion {
  feeAPR: number;
  farmAPR: number;
  pool: {
    currentTick: number;
    feeRate: number;
    feeTier: number;
    poolId: string;
    senderAddress: string;
    sqrtPrice: string;
    token1: string;
    token2: string;
    token1Info: {
      decimals: number;
    };
    token2Info: {
      decimals: number;
    };
  };
}
