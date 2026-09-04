import { HEADER_API_KEY } from '@libs/constants/context.constant';
import { EEnvKey } from '@libs/constants/env.constant';
import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class InternalApiGuard implements CanActivate {
  constructor(private configService: ConfigService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const apiKey = request.headers[HEADER_API_KEY];
    const configApiKey = this.configService.get<string>(EEnvKey.API_KEY);

    if (!apiKey || apiKey !== configApiKey) {
      throw new UnauthorizedException('Invalid API key');
    }

    return true;
  }
}
