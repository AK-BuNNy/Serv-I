import { Controller, Post, Get, Body, Query } from '@nestjs/common';
import { LogsService } from './logs.service';

@Controller('logs')
export class LogsController {
  constructor(private logsService: LogsService) {}

  @Post('ingest')
  async ingest(@Body() body: { source: string; line: string }) {
    return this.logsService.ingest(
      body.source || 'manual',
      body.line,
    );
  }

  @Get()
  async findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.logsService.findAll(
      parseInt(page || '1', 10),
      parseInt(limit || '50', 10),
    );
  }
}
