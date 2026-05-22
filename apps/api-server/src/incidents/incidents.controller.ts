import { Controller, Get, Post, Param, Query, Body } from '@nestjs/common';
import { IncidentsService } from './incidents.service';

@Controller('incidents')
export class IncidentsController {
  constructor(private incidentsService: IncidentsService) {}

  @Get()
  async findAll(
    @Query('severity') severity?: string,
    @Query('category') category?: string,
    @Query('provider') provider?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.incidentsService.findAll({
      severity,
      category,
      provider,
      page: parseInt(page || '1', 10),
      limit: parseInt(limit || '20', 10),
    });
  }

  @Get('stats')
  async getStats() {
    return this.incidentsService.getStats();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.incidentsService.findOne(id);
  }

  @Post('search')
  async search(
    @Body() body: { query: string; limit?: number },
  ) {
    return this.incidentsService.search(body.query, body.limit);
  }
}
