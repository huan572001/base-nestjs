require('dotenv').config();
import { Module } from '@nestjs/common';
import { ExampleConsoleModule } from 'apps/api-service/src/modules/consoles/example/example-console.module';

const IMPORTS = [ExampleConsoleModule];

@Module({
  imports: [...IMPORTS],
  controllers: [],
  providers: [],
})
export class ConsoleBaseModule {}
