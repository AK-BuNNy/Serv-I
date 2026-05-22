import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AiService } from '../ai/ai.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class IncidentsService {
  constructor(
    private prisma: PrismaService,
    private aiService: AiService,
  ) {}

  async findAll(filters: {
    severity?: string;
    category?: string;
    provider?: string;
    page?: number;
    limit?: number;
  }) {
    const { severity, category, provider, page = 1, limit = 20 } = filters;
    const skip = (page - 1) * limit;

    const where: Prisma.IncidentWhereInput = {};
    if (severity) where.severity = severity;
    if (category) where.category = category;
    if (provider) where.aiProvider = provider;

    const [incidents, total] = await Promise.all([
      this.prisma.incident.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          reports: {
            select: { id: true, title: true, createdAt: true },
          },
        },
      }),
      this.prisma.incident.count({ where }),
    ]);

    return {
      data: incidents,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string) {
    return this.prisma.incident.findUnique({
      where: { id },
      include: {
        reports: true,
      },
    });
  }

  async search(query: string, limit = 10) {
    // Generate embedding for the search query
    const embedding = await this.aiService.generateEmbedding(query);
    const vectorStr = `[${embedding.join(',')}]`;

    // Cosine similarity search using pgvector
    const results = await this.prisma.$queryRaw`
      SELECT
        id,
        source,
        severity,
        category,
        raw_log as "rawLog",
        message,
        ai_summary as "aiSummary",
        ai_provider as "aiProvider",
        confidence,
        indicators,
        created_at as "createdAt",
        1 - (embedding <=> ${vectorStr}::vector) as similarity
      FROM incidents
      WHERE embedding IS NOT NULL
      ORDER BY embedding <=> ${vectorStr}::vector
      LIMIT ${limit}
    `;

    return {
      query,
      provider: this.aiService.embeddingProviderName,
      results,
    };
  }

  async getStats() {
    const [total, bySeverity, byCategory, recentCount] = await Promise.all([
      this.prisma.incident.count(),
      this.prisma.incident.groupBy({
        by: ['severity'],
        _count: { id: true },
      }),
      this.prisma.incident.groupBy({
        by: ['category'],
        _count: { id: true },
      }),
      this.prisma.incident.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // last 24h
          },
        },
      }),
    ]);

    const severityMap: Record<string, number> = {};
    bySeverity.forEach((s) => {
      severityMap[s.severity] = s._count.id;
    });

    const categoryMap: Record<string, number> = {};
    byCategory.forEach((c) => {
      categoryMap[c.category] = c._count.id;
    });

    return {
      total,
      last24h: recentCount,
      bySeverity: severityMap,
      byCategory: categoryMap,
      critical: severityMap['critical'] || 0,
      high: severityMap['high'] || 0,
      medium: severityMap['medium'] || 0,
      low: severityMap['low'] || 0,
      info: severityMap['info'] || 0,
    };
  }
}
