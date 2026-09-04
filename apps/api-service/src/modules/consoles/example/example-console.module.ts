// module.ts - your module
import { Module } from '@nestjs/common';
import { ConsoleModule } from 'nestjs-console';

@Module({
  imports: [ConsoleModule],
  providers: [],
  exports: [],
})
export class ExampleConsoleModule {}
