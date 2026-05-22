import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { QueueService } from '../queue/queue.service';

@Injectable()
export class LogsService {
  constructor(
    private prisma: PrismaService,
    private queueService: QueueService,
  ) {}

  async ingest(source: string, line: string) {
    // Store the raw log entry
    const logEntry = await this.prisma.logEntry.create({
      data: {
        source,
        line,
      },
    });

    // Enqueue for AI analysis
    const jobId = await this.queueService.enqueueLogAnalysis({
      path: source,
      line,
      timestamp: new Date().toISOString(),
      logEntryId: logEntry.id,
    });

    return {
      logEntryId: logEntry.id,
      jobId,
      status: 'queued',
    };
  }

  async findAll(page = 1, limit = 50) {
    const skip = (page - 1) * limit;

    const [entries, total] = await Promise.all([
      this.prisma.logEntry.findMany({
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.logEntry.count(),
    ]);

    return {
      data: entries,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }
}
