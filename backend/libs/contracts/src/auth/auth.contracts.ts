export type AuthUserResponse = {
  readonly id: string;
  readonly phone: string;
  readonly email: string | null;
  readonly fullName: string;
};

export type AuthRegisterRequest = {
  readonly phone: string;
  readonly password: string;
  readonly fullName: string;
  readonly email?: string;
};

export type AuthLoginRequest = {
  readonly phone: string;
  readonly password: string;
};

export type AuthLogoutRequest = {
  readonly accessToken: string;
};

export type AuthLogoutResponse = {
  readonly isSuccess: boolean;
};

/** Claims embedded in access tokens issued by auth-service. */
export type AuthAccessTokenClaims = {
  readonly sub: string;
  readonly phone: string;
  /** Empty string when the user has no email. */
  readonly email: string;
  readonly fullName: string;
  readonly jti: string;
};

export type AuthTokenResponse = {
  readonly accessToken: string;
  readonly tokenType: 'Bearer';
  readonly expiresIn: string;
  readonly user: AuthUserResponse;
};

export type AuthVerifyTokenResponse = {
  readonly isValid: boolean;
  readonly user: AuthUserResponse | null;
  readonly reason: string | null;
};

export const AUTH_MESSAGE_PATTERN = {
  register: 'auth-register',
  login: 'auth-login',
  logout: 'auth-logout',
} as const;
