import { ACCESS_TOKEN_COOKIE_NAME } from '../constants/access-token-cookie-name.constant';
import { extractBearerToken } from './extract-bearer-token';

type ExtractHttpAccessTokenInput = {
  readonly authorizationHeader: string | string[] | undefined;
  readonly cookies?: Record<string, string | undefined>;
};

/**
 * Resolves JWT from Authorization Bearer or access-token cookie (API gateway).
 */
export function extractHttpAccessToken(
  input: ExtractHttpAccessTokenInput,
): string | null {
  const fromBearer: string | null = extractBearerToken({
    authorizationHeader: input.authorizationHeader,
  });
  if (fromBearer) {
    return fromBearer;
  }
  const fromCookie: string | undefined =
    input.cookies?.[ACCESS_TOKEN_COOKIE_NAME];
  if (fromCookie && fromCookie.trim().length > 0) {
    return fromCookie;
  }
  return null;
}
