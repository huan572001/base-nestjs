export interface FungibleAssetMetadata {
  supply_v2: number;
  decimals: number;
  asset_type: string;
  name: string;
  symbol: string;
  token_standard: string;
}
export interface CurrentFungibleAssetBalance {
  amount: string;
  metadata: {
    asset_type: string;
    decimals: number;
  };
}
export class FungibleAssetMetadataQueryDto {
  static getQuery(asset_type: string) {
    return `
      query MyQuery {
        fungible_asset_metadata(
          where: {asset_type: {_eq: "${asset_type}"}}
        ) {
            supply_v2
            decimals
            asset_type
            name
            symbol
            token_standard
        }
      }
    `;
  }
}
export class CurrentFungibleAssetBalanceQueryDto {
  static getQuery(owner: string) {
    return `query MyQuery {
      current_fungible_asset_balances(
        where: {owner_address: {_eq: "${owner}"}}
      ) {
        amount
        metadata {
          asset_type
          decimals
        }
      }
    }`;
  }
}
