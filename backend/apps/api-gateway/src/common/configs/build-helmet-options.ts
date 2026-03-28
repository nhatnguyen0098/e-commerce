import type { RequestHandler } from 'express';
import type { HelmetOptions } from 'helmet';
import helmet from 'helmet';

/**
 * Helmet defaults tuned for a JSON API + cross-origin SPA (CORS + cookies).
 */
export function buildHelmetOptions(): HelmetOptions {
  return {
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    contentSecurityPolicy: false,
  };
}

type HelmetMiddlewareFactory = (
  options?: Readonly<HelmetOptions>,
) => RequestHandler;

/**
 * Express middleware from Helmet (factory typed explicitly for NodeNext + ESLint).
 */
export function createHelmetMiddleware(): RequestHandler {
  const factory = helmet as HelmetMiddlewareFactory;
  return factory(buildHelmetOptions());
}
