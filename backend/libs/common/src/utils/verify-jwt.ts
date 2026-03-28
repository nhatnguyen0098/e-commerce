import { verify, type JwtPayload } from 'jsonwebtoken';
import type {
  AuthAccessTokenClaims,
  AuthVerifyTokenResponse,
} from '@contracts/auth/auth.contracts';
import { getJwtSecret } from '../configs/get-jwt-secret';

type VerifyJwtInput = {
  readonly accessToken: string;
};

/**
 * Verifies an access JWT with the shared AUTH_JWT_SECRET.
 * Does not consult auth-service (e.g. in-memory revocation lists are not applied).
 */
export function verifyJwt(input: VerifyJwtInput): AuthVerifyTokenResponse {
  try {
    const decoded: string | JwtPayload = verify(
      input.accessToken,
      getJwtSecret(),
      { algorithms: ['HS256'] },
    );
    if (typeof decoded === 'string' || !isAuthAccessTokenClaims(decoded)) {
      return {
        isValid: false,
        user: null,
        reason: 'Token payload is invalid',
      };
    }
    return {
      isValid: true,
      user: {
        id: decoded.sub,
        phone: decoded.phone,
        email: decoded.email.length > 0 ? decoded.email : null,
        fullName: decoded.fullName,
      },
      reason: null,
    };
  } catch {
    return {
      isValid: false,
      user: null,
      reason: 'Token is invalid or expired',
    };
  }
}

function isAuthAccessTokenClaims(
  decoded: JwtPayload,
): decoded is JwtPayload & AuthAccessTokenClaims {
  const sub: unknown = decoded.sub;
  const phone: unknown = decoded.phone;
  const email: unknown = decoded.email;
  const fullName: unknown = decoded.fullName;
  const jti: unknown = decoded.jti;
  return (
    typeof sub === 'string' &&
    typeof phone === 'string' &&
    typeof email === 'string' &&
    typeof fullName === 'string' &&
    typeof jti === 'string'
  );
}
