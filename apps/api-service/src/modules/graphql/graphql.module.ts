import { Module } from '@nestjs/common';

import { AptosIndexerModule } from '@lib/service/aptos-indexer/aptos-indexer.module';
import { GraphqlService } from './graphql.service';
import { GraphqlController } from './graphql.controller';

@Module({
  imports: [AptosIndexerModule],
  controllers: [GraphqlController],
  providers: [GraphqlService],
})
export class GraphqlModule {}
