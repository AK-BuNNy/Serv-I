import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AiService } from '../ai/ai.service';

@Injectable()
export class ReportsService {
  constructor(
    private prisma: PrismaService,
    private aiService: AiService,
  ) {}

  async generate(incidentId: string) {
    const incident = await this.prisma.incident.findUnique({
      where: { id: incidentId },
    });

    if (!incident) {
      throw new NotFoundException(`Incident ${incidentId} not found`);
    }

    // Generate report using the active AI provider
    const reportContent = await this.aiService.generateReport({
      id: incident.id,
      source: incident.source,
      severity: incident.severity,
      category: incident.category,
      rawLog: incident.rawLog,
      message: incident.message,
      aiSummary: incident.aiSummary || undefined,
      indicators: (incident.indicators as string[]) || [],
      confidence: incident.confidence || undefined,
      createdAt: incident.createdAt,
    });

    // Store the report
    const report = await this.prisma.threatReport.create({
      data: {
        incidentId: incident.id,
        title: `Incident Report: ${incident.category} — ${incident.severity.toUpperCase()}`,
        content: reportContent,
        aiProvider: this.aiService.providerName,
      },
    });

    // Also update the incident's report_markdown
    await this.prisma.incident.update({
      where: { id: incidentId },
      data: { reportMarkdown: reportContent },
    });

    return report;
  }

  async findOne(id: string) {
    const report = await this.prisma.threatReport.findUnique({
      where: { id },
      include: { incident: true },
    });

    if (!report) {
      throw new NotFoundException(`Report ${id} not found`);
    }

    return report;
  }

  async findAll(page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const [reports, total] = await Promise.all([
      this.prisma.threatReport.findMany({
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          incident: {
            select: { id: true, severity: true, category: true, source: true },
          },
        },
      }),
      this.prisma.threatReport.count(),
    ]);

    return {
      data: reports,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }
}
