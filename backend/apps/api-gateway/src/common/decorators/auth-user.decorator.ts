import {
  createParamDecorator,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import type { AuthUserResponse } from '@contracts/auth/auth.contracts';
import type { AuthenticatedRequest } from '../types/authenticated-request.type';

/**
 * Returns the authenticated user set by AuthGuard (JWT / cookie).
 */
export const AuthUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): AuthUserResponse => {
    const request: AuthenticatedRequest = context.switchToHttp().getRequest();
    const user: AuthUserResponse | undefined = request.authUser;
    if (!user) {
      throw new UnauthorizedException();
    }
    return user;
  },
);
