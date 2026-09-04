import { Logger } from '@libs/common/loggers';
import { Injectable } from '@nestjs/common';

import { AptosIndexerService } from '@lib/service/aptos-indexer/aptos-indexer.service';

@Injectable()
export class GraphqlService {
  private logger = new Logger(GraphqlService.name);
  constructor(private readonly aptosIndexerService: AptosIndexerService) {}
}
