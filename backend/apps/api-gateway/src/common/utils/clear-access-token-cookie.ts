import type { Response } from 'express';
import { ACCESS_TOKEN_COOKIE_NAME } from '@common/constants/access-token-cookie-name.constant';

/**
 * Clears access token cookie (e.g. after logout).
 */
export function clearAccessTokenCookie(response: Response): void {
  response.clearCookie(ACCESS_TOKEN_COOKIE_NAME, { path: '/' });
}
