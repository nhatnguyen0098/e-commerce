import {
  createParamDecorator,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import type { AuthenticatedRequest } from '../types/authenticated-request.type';

/**
 * Returns the Bearer token string set by AuthGuard on protected routes.
 */
export const AccessToken = createParamDecorator(
  (_data: unknown, context: ExecutionContext): string => {
    const request: AuthenticatedRequest = context.switchToHttp().getRequest();
    const accessToken: string | undefined = request.accessToken;
    if (!accessToken) {
      throw new UnauthorizedException('Missing access token on request');
    }
    return accessToken;
  },
);
