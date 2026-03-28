import { Injectable, OnModuleDestroy } from '@nestjs/common';
import Redis from 'ioredis';
import { getConfig } from '@common/configs/get-config';

/**
 * Thin Redis wrapper for JSON cache entries. When `REDIS_URL` is unset, all operations no-op.
 */
@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly client: Redis | null;

  public constructor() {
    const url: string = getConfig({
      configKey: 'REDIS_URL',
      defaultValue: '',
    }).trim();
    this.client =
      url.length > 0
        ? new Redis(url, {
            maxRetriesPerRequest: 1,
            enableReadyCheck: true,
          })
        : null;
  }

  public async getJson<T>(key: string): Promise<T | undefined> {
    if (this.client === null) {
      return undefined;
    }
    try {
      const raw: string | null = await this.client.get(key);
      if (raw === null) {
        return undefined;
      }
      return JSON.parse(raw) as T;
    } catch {
      return undefined;
    }
  }

  public async setJson(
    key: string,
    value: unknown,
    ttlSeconds: number,
  ): Promise<void> {
    if (this.client === null || ttlSeconds <= 0) {
      return;
    }
    try {
      await this.client.set(key, JSON.stringify(value), 'EX', ttlSeconds);
    } catch {
      return;
    }
  }

  public async onModuleDestroy(): Promise<void> {
    if (this.client !== null) {
      await this.client.quit();
    }
  }
}
