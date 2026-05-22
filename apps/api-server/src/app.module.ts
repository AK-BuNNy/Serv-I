import { Module, Controller, Get } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { AiModule } from './ai/ai.module';
import { QueueModule } from './queue/queue.module';
import { LogsModule } from './logs/logs.module';
import { IncidentsModule } from './incidents/incidents.module';
import { ReportsModule } from './reports/reports.module';
import { AiService } from './ai/ai.service';

@Controller()
class HealthController {
  constructor(private aiService: AiService) {}

  @Get()
  health() {
    return {
      status: 'ok',
      service: 'Serv-I Cybersecurity API',
      aiProvider: this.aiService.providerName,
      embeddingProvider: this.aiService.embeddingProviderName,
      timestamp: new Date().toISOString(),
    };
  }
}

@Module({
  imports: [
    PrismaModule,
    AiModule,
    QueueModule,
    LogsModule,
    IncidentsModule,
    ReportsModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
