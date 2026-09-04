import { InternalApiGuard } from '@api/modules/auth/internal-api.guard';
import { applyDecorators, createParamDecorator, ExecutionContext, SetMetadata, UseGuards } from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { JwtGuard } from 'apps/api-service/src/modules/auth/jwt.guard';

export const IS_PUBLIC_KEY = 'isPublic';
export const NONE_PERMISSION_KEY = 'IS_NONE_PERMISSION';
export const PublicApi = () => SetMetadata(IS_PUBLIC_KEY, true);
export const SkipRoles = () => SetMetadata(NONE_PERMISSION_KEY, true);
export const CurrentUser = createParamDecorator((data: undefined, ctx: ExecutionContext) => {
  const req = ctx.switchToHttp().getRequest();
  return req.user;
});

export function UseAuth() {
  return applyDecorators(UseGuards(JwtGuard), ApiBearerAuth());
}

export const IS_INTERNAL_API_KEY = 'isInternalApi';
export const InternalApi = () => SetMetadata(IS_INTERNAL_API_KEY, true);

export function UseInternalAuth() {
  return applyDecorators(UseGuards(InternalApiGuard), InternalApi());
}
