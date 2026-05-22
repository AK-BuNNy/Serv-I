import { Controller, Post, Get, Param, Query } from '@nestjs/common';
import { ReportsService } from './reports.service';

@Controller('reports')
export class ReportsController {
  constructor(private reportsService: ReportsService) {}

  @Post('generate/:incidentId')
  async generate(@Param('incidentId') incidentId: string) {
    return this.reportsService.generate(incidentId);
  }

  @Get()
  async findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.reportsService.findAll(
      parseInt(page || '1', 10),
      parseInt(limit || '20', 10),
    );
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.reportsService.findOne(id);
  }
}
