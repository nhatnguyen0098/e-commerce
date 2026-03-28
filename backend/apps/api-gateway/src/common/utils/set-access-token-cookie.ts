import type { Response } from 'express';
import { getConfig } from '@common/configs/get-config';
import { ACCESS_TOKEN_COOKIE_NAME } from '@common/constants/access-token-cookie-name.constant';

/**
 * Sets httpOnly JWT cookie (align max age with token TTL in production via env).
 */
export function setAccessTokenCookie(
  response: Response,
  accessToken: string,
): void {
  const maxAgeParsed: number = Number(
    getConfig({
      configKey: 'AUTH_ACCESS_TOKEN_COOKIE_MAX_AGE_MS',
      defaultValue: '3600000',
    }),
  );
  const maxAgeMs: number = Number.isNaN(maxAgeParsed) ? 3600000 : maxAgeParsed;
  const secureFlag: boolean =
    getConfig({
      configKey: 'AUTH_ACCESS_TOKEN_COOKIE_SECURE',
      defaultValue: process.env.NODE_ENV === 'production' ? 'true' : 'false',
    }) === 'true';
  const sameSiteRaw: string = getConfig({
    configKey: 'AUTH_ACCESS_TOKEN_COOKIE_SAME_SITE',
    defaultValue: 'lax',
  });
  const sameSite: 'lax' | 'strict' | 'none' =
    sameSiteRaw === 'strict' || sameSiteRaw === 'none' ? sameSiteRaw : 'lax';
  response.cookie(ACCESS_TOKEN_COOKIE_NAME, accessToken, {
    httpOnly: true,
    secure: secureFlag,
    sameSite,
    maxAge: maxAgeMs,
    path: '/',
  });
}
