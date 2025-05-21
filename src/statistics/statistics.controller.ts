import { Controller, Post, Get, Param } from '@nestjs/common';
import { StatisticsService } from './statistics.service';

@Controller('statistics')
export class StatisticsController {
  constructor(private readonly statisticsService: StatisticsService) {}

  @Post(':countryCode')
  async updateStatistics(@Param('countryCode') countryCode: string): Promise<void> {
    await this.statisticsService.updateStatistics(countryCode);
  }

  @Get()
  async getAllStatistics(): Promise<Record<string, number>> {
    return this.statisticsService.getAllStatistics();
  }
} 