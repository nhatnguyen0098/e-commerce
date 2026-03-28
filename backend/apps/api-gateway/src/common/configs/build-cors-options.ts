import type { CorsOptions } from '@nestjs/common/interfaces/external/cors-options.interface';
import { getConfig } from '@common/configs/get-config';

/**
 * Builds Nest CORS options for the API gateway (cookie auth needs credentials: true).
 */
export function buildCorsOptions(): CorsOptions {
  const originRaw: string = getConfig({
    configKey: 'API_GATEWAY_CORS_ORIGIN',
    defaultValue: 'reflect',
  }).trim();
  let origin: CorsOptions['origin'];
  if (originRaw.toLowerCase() === 'reflect') {
    origin = true;
  } else {
    const parts: string[] = originRaw
      .split(',')
      .map((segment: string) => segment.trim())
      .filter((segment: string) => segment.length > 0);
    if (parts.length === 0) {
      origin = true;
    } else if (parts.length === 1) {
      origin = parts[0];
    } else {
      origin = parts;
    }
  }
  return {
    origin,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Cookie'],
    exposedHeaders: ['Set-Cookie'],
  };
}
