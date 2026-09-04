import { Logger } from '@libs/common/loggers';
import { UserRepository } from '@libs/infra/postgres/repositories';
import { Injectable } from '@nestjs/common';

@Injectable()
export class AuthService {
  private logger = new Logger(AuthService.name);
  constructor(private userRepository: UserRepository) {}
}
