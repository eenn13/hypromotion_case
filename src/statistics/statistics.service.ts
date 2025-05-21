import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { createClient } from 'redis';

@Injectable()
export class StatisticsService implements OnModuleDestroy {
  private readonly redisClient;

  constructor() {
    this.redisClient = createClient({
      url: 'redis://localhost:6379',
      socket: {
        keepAlive: true,
        reconnectStrategy: (retries) => Math.min(retries * 50, 1000)
      }
    });
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
    let cursor = 0;
    
    do {
      const [nextCursor, keys] = await this.redisClient.scan(cursor, {
        MATCH: '*',
        COUNT: 100
      });
      cursor = nextCursor;

      if (keys.length > 0) {
        const pipeline = this.redisClient.multi();
        keys.forEach(key => pipeline.get(key));
        const values = await pipeline.exec();
        
        keys.forEach((key, index) => {
          const count = values[index];
          if (count !== null) {
            statistics[key] = parseInt(count, 10);
          }
        });
      }
    } while (cursor !== 0);

    return statistics;
  }
} 