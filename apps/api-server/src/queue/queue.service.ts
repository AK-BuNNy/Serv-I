import { Injectable } from '@nestjs/common';
import { Queue } from 'bullmq';

@Injectable()
export class QueueService {
  private queue: Queue;

  constructor() {
    this.queue = new Queue('security-events', {
      connection: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379', 10),
      },
    });
    console.log('✓ BullMQ queue connected');
  }

  async enqueueLogAnalysis(data: { path: string; line: string; timestamp: string; logEntryId: string }) {
    const job = await this.queue.add('analyze-log', data, {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 1000,
      },
    });
    return job.id;
  }
}
