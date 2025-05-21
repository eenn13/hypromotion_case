import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { createClient } from 'redis';

@Injectable()
export class StatisticsService implements OnModuleDestroy {
  private readonly redisClient;

  constructor() {
    this.redisClient = createClient({
      url: process.env.REDIS_URL,
      socket: {
        keepAlive: true,
        reconnectStrategy: (retries) => Math.min(retries * 50, 1000),
      },
    });

    this.redisClient.on('error', (err) =>
      console.error('Redis Client Error', err),
    );
    this.redisClient.connect();
  }

  async onModuleDestroy() {
    await this.redisClient.quit();
  }

  async updateStatistics(countryCode: string): Promise<void> {
    if (typeof countryCode !== 'string' || countryCode.trim() === '') {
      throw new Error(
        'updateStatistics: countryCode must be a non-empty string',
      );
    }
    try {
      await this.redisClient.incr(countryCode); // Increment the count for the given country code
    } catch (error) {
      console.error(
        `Redis INCR error (key: ${countryCode}): ${(error as Error).message}`,
        error,
      );
      throw new Error('Failed to update statistics (Redis error)');
    }
  }

  async getAllStatistics(): Promise<Record<string, number>> {
    const statistics: Record<string, number> = {};
    let cursor = '0';

    try {
      do {
        // ---------- SCAN ----------
        const scanRes = await this.redisClient.scan(cursor, {
          MATCH: '*',
          COUNT: 100,
        });
        cursor = scanRes.cursor;
        const keys = scanRes.keys;

        if (keys.length) {
          // ---------- MULTI/PIPELINE ----------
          const pipeline = this.redisClient.multi();
          keys.forEach((k) => pipeline.get(k));
          const rawResults = await pipeline.exec(); //  [[null,'123'], [Error,...]] / ['123', ...] = ioredis vs node-redis

          // node-redis (v4) ⇒ string[]  |  ioredis ⇒ [err,value][]
          rawResults.forEach((res, idx) => {
            // ioredis: res = [err, value]
            const value = Array.isArray(res) && res.length === 2 ? res[1] : res;
            // Log the error
            if (Array.isArray(res) && res[0]) {
              console.warn(
                `Redis GET error (key: ${keys[idx]}): ${(res[0] as Error).message}`,
              );
              return; //
            }

            // If the value can be converted to a number, add it
            const num = parseInt(String(value), 10);
            if (!Number.isNaN(num)) {
              statistics[keys[idx]] = num;
            }
          });
        }
      } while (cursor !== '0');
    } catch (err) {
      console.error(`getAllStatistics error: ${(err as Error).message}`, err);
      throw new Error('Failed to get all statistics (Redis error)');
    }

    return statistics;
  }
}
