import { Logger } from '@libs/common/loggers/logger.service';
import { Inject, Injectable } from '@nestjs/common';
import { APTOS_INDEXER_HTTP_TOKEN, IHttpService } from 'libs/infra/src/http';
import {
  CurrentFungibleAssetBalance,
  CurrentFungibleAssetBalanceQueryDto,
  FungibleAssetMetadata,
  FungibleAssetMetadataQueryDto,
} from './dto/fungible-asset-metadata.dto';
@Injectable()
export class AptosIndexerService {
  private readonly _logger = new Logger(AptosIndexerService.name);

  public constructor(@Inject(APTOS_INDEXER_HTTP_TOKEN) private _httpService: IHttpService) {}

  async getFungibleAssetMetadata(asset_type: string): Promise<FungibleAssetMetadata> {
    const query = FungibleAssetMetadataQueryDto.getQuery(asset_type);
    const response = await this._httpService.post('/', { query });
    return response.data?.data?.fungible_asset_metadata ?? ({} as FungibleAssetMetadata);
  }
  async getCurrentFungibleAssetBalance(owner: string): Promise<CurrentFungibleAssetBalance[]> {
    const query = CurrentFungibleAssetBalanceQueryDto.getQuery(owner);
    const response = await this._httpService.post('/', { query });
    return response.data?.data?.current_fungible_asset_balances ?? ([] as CurrentFungibleAssetBalance[]);
  }
  async query(query: string) {
    const response = await this._httpService.post('/', { query });
    return response.data;
  }
}
