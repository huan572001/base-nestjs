import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { EEnvKey } from 'libs/constants/src/env.constant';
import { UserPayload } from 'libs/infra/src/postgres/entities/user.entity';
import { ExtractJwt, Strategy } from 'passport-jwt';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get(EEnvKey.JWT_ACCESS_SECRET_KEY),
    });
  }

  async validate(payload: UserPayload) {
    return payload;
  }
}
