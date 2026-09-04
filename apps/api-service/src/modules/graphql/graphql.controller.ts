import { Body, Controller, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { AptosIndexerService } from '@lib/service/aptos-indexer/aptos-indexer.service';

@ApiTags('graphql')
@Controller({
  path: 'graphql',
  version: '1',
})
export class GraphqlController {
  constructor(private readonly aptosIndexerService: AptosIndexerService) {}
  @Post()
  async proxyIndexer(@Body() body: any) {
    return this.aptosIndexerService.query(body.query);
  }
}
