import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { createClient } from 'redis';

@Injectable()
export class StatisticsService implements OnModuleDestroy {
  private readonly redisClient;

  constructor() {
    this.redisClient = createClient({
      url: 'redis://127.0.0.1:6379',
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
    await this.redisClient.incr(countryCode);
  }

  async getAllStatistics(): Promise<Record<string, number>> {
    const statistics: Record<string, number> = {};

    // cursor değişkenini string olarak tanımlıyoruz.
    let cursorCount = '0';

    do {
      const { cursor, keys } = await this.redisClient.scan(cursorCount, {
        MATCH: '*',
        COUNT: 100,
      });
      cursorCount = cursor;

      if (keys.length > 0) {
        const pipeline = this.redisClient.multi();
        keys.forEach((key) => pipeline.get(key));

        const values = await pipeline.exec();

        keys.forEach((key, index) => {
          const [err, count] = values[index];
          if (!err && count !== null) {
            statistics[key] = parseInt(count, 10);
          }
        });
      }
    } while (cursorCount !== '0');

    return statistics;
  }
}
