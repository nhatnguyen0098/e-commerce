import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { extractHttpAccessToken } from '@common/utils/extract-http-access-token';
import { verifyJwt } from '@common/utils/verify-jwt';
import { PUBLIC_ROUTE_METADATA_KEY } from '../constants/public-route-metadata-key.constant';
import type { AuthenticatedRequest } from '../types/authenticated-request.type';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  /**
   * Validate bearer token for protected HTTP routes.
   */
  public canActivate(context: ExecutionContext): boolean {
    const isPublicRoute: boolean =
      this.reflector.getAllAndOverride<boolean>(PUBLIC_ROUTE_METADATA_KEY, [
        context.getHandler(),
        context.getClass(),
      ]) ?? false;
    if (isPublicRoute) {
      return true;
    }
    const request: AuthenticatedRequest = context.switchToHttp().getRequest();
    const accessToken: string | null = extractHttpAccessToken({
      authorizationHeader: request.headers.authorization,
      cookies: request.cookies,
    });
    if (!accessToken) {
      throw new UnauthorizedException(
        'Missing or invalid Authorization header',
      );
    }
    const verifyResult = verifyJwt({ accessToken });
    if (!verifyResult.isValid || !verifyResult.user) {
      throw new UnauthorizedException(verifyResult.reason ?? 'Unauthorized');
    }
    request.accessToken = accessToken;
    request.authUser = verifyResult.user;
    return true;
  }
}
