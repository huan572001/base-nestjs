import { ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { InjectRepository } from '@nestjs/typeorm';
import { IS_INTERNAL_API_KEY, IS_PUBLIC_KEY } from 'apps/api-service/src/shared/decorators';
import { Unauthorized } from 'libs/common/src/exception';
import { ErrorConstant } from 'libs/constants/src/error.constant';
import { UserEntity, UserPayload } from 'libs/infra/src/postgres/entities/user.entity';
import { Repository } from 'typeorm';

@Injectable()
export class JwtGuard extends AuthGuard(['jwt']) {
  constructor(
    private reflector: Reflector,
    @InjectRepository(UserEntity)
    private userRepository: Repository<UserEntity>,
  ) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    const isInternalApi = this.reflector.getAllAndOverride<boolean>(IS_INTERNAL_API_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isInternalApi) return true;
    try {
      // Try to validate JWT token if present, even for public routes
      const res = await super.canActivate(context);
      return res === true;
    } catch (err) {
      // If route is public and JWT validation fails, still allow access
      if (isPublic) {
        return true;
      }
      // For protected routes, throw the error
      throw err;
    }
  }

  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  async handleRequest(err: any, userPayload: UserPayload) {
    if (err || !userPayload) {
      throw (
        err ||
        new Unauthorized({
          message: ErrorConstant.AUTH.UNAUTHORIZED.message,
          errorCode: ErrorConstant.AUTH.UNAUTHORIZED.errorCode,
        })
      );
    }

    return userPayload;
  }
}
