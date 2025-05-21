import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { StatisticsModule } from './statistics/statistics.module';

@Module({
  imports: [StatisticsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
