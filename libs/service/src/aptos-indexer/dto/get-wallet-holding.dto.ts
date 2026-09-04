export const fetchWalletHoldingQuery = (owner_address: string, limit: number, offset: number) => `
    query {
      current_token_ownerships_v2(
        where: {
          owner_address: { _eq: "${owner_address}" }
          amount: { _gt: 0 }
        }
        offset: ${offset}
        limit: ${limit}
        order_by: [
          { last_transaction_version: desc }
          { token_data_id: desc }
        ]
      ) {
        token_standard
        token_properties_mutated_v1
        token_data_id
        table_type_v1
        storage_id
        property_version_v1
        owner_address
        last_transaction_version
        last_transaction_timestamp
        is_soulbound_v2
        is_fungible_v2
        amount
        current_token_data {
          collection_id
          description
          is_fungible_v2
          largest_property_version_v1
          last_transaction_timestamp
          last_transaction_version
          maximum
          supply
          token_data_id
          token_name
          token_properties
          token_standard
          token_uri
          cdn_asset_uris {
            asset_uri
            cdn_json_uri
            cdn_image_uri
          }
          current_collection {
            collection_id
            collection_name
            creator_address
            current_supply
            description
            last_transaction_timestamp
            last_transaction_version
            max_supply
            mutable_description
            mutable_uri
            table_handle_v1
            token_standard
            total_minted_v2
            uri
            cdn_asset_uris {
              asset_uri
              cdn_json_uri
              cdn_image_uri
            }
          }
        }
      }
    }
`;

export const fetchNftDataQuery = (token_data_ids: string[], offset: number, limit: number) => {
  let inClause = '';

  token_data_ids.forEach(address => {
    inClause += `"${address}",`;
  });

  return `
  query {
    current_token_datas_v2(
      where: {token_data_id: { _in: [${inClause.slice(0, -1)}] }}
      offset: ${offset}
      limit: ${limit}
    ) {
      token_name
      token_data_id
    }
  }
`;
};

export class FetchWalletHoldingResponseDto {
  data: TokenOwnershipResponse;
}

export class FetchNftDataResponseDto {
  data: TokenDataResponse;
}

class TokenDataResponse {
  current_token_datas_v2: { token_name: string; token_data_id: string }[];
}

class TokenCollection {
  collection_id: string;
  collection_name: string;
  creator_address: string;
  current_supply: number;
  description: string;
  last_transaction_timestamp: string;
  last_transaction_version: number;
  max_supply: number | null;
  mutable_description: string | null;
  mutable_uri: string | null;
  table_handle_v1: string | null;
  token_standard: string;
  total_minted_v2: number;
  uri: string;
  cdn_asset_uris: CdnAssetUris;
}

class TokenData {
  collection_id: string;
  description: string;
  is_fungible_v2: boolean;
  largest_property_version_v1: number | null;
  last_transaction_timestamp: string;
  last_transaction_version: number;
  maximum: number | null;
  supply: number | null;
  token_data_id: string;
  token_name: string;
  token_properties: any;
  token_standard: string;
  token_uri: string;
  cdn_asset_uris: CdnAssetUris;
  current_collection: TokenCollection;
}

export class TokenOwnership {
  token_standard: string;
  token_properties_mutated_v1: any;
  token_data_id: string;
  table_type_v1: string | null;
  storage_id: string;
  property_version_v1: number;
  owner_address: string;
  last_transaction_version: number;
  last_transaction_timestamp: string;
  is_soulbound_v2: boolean;
  is_fungible_v2: boolean | null;
  amount: number;
  current_token_data: TokenData;
}

class CdnAssetUris {
  asset_uri: string;
  cdn_json_uri: string;
  cdn_image_uri: string;
}

class TokenOwnershipResponse {
  current_token_ownerships_v2: TokenOwnership[];
}
