import type { Request } from 'express';
import type { AuthUserResponse } from '@contracts/auth/auth.contracts';

export type AuthenticatedRequest = Request & {
  accessToken?: string;
  authUser?: AuthUserResponse;
};
