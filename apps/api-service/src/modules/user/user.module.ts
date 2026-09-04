import { Module } from '@nestjs/common';
import { UserRepository } from 'libs/infra/src/postgres/repositories';

import { AuthModule } from '@api/modules/auth/auth.module';
import { AuthService } from '@api/modules/auth/auth.service';
import { AptosIndexerModule } from '@lib/service/aptos-indexer/aptos-indexer.module';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { HttpModule } from '@nestjs/axios';
import { TicketModule } from '../ticket/ticket.module';

@Module({
  imports: [AuthModule, JwtModule, AptosIndexerModule, HttpModule, TicketModule],
  controllers: [UserController],
  providers: [UserService, UserRepository, AuthService, JwtService],
})
export class UserModule {}
