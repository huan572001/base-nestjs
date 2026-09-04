import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  constructor() {
    // Constructor intentionally left empty
  }

  getHello(): string {
    return 'Hello World!';
  }
}
