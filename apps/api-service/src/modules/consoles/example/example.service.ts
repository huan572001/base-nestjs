// service.ts - a nestjs provider using console decorators
import { Console, Command } from 'nestjs-console';

@Console()
export class ExampleService {
  @Command({
    command: 'list <directory>',
    description: 'List content of a directory',
  })
  async listContent(directory: string): Promise<void> {
    console.log(`List content of ${directory}`);
  }
}
