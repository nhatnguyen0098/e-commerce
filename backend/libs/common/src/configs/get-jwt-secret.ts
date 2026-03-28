import { getConfig } from './get-config';

const DEFAULT_JWT_SECRET: string = 'dev-auth-secret-change-me';

/**
 * Resolves JWT signing secret from AUTH_JWT_SECRET or the dev default.
 */
export function getJwtSecret(): string {
  return getConfig({
    configKey: 'AUTH_JWT_SECRET',
    defaultValue: DEFAULT_JWT_SECRET,
  });
}
