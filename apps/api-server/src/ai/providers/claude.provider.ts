import Anthropic from '@anthropic-ai/sdk';
import {
  IAiProvider,
  ThreatClassification,
  IncidentData,
  THREAT_CLASSIFICATION_PROMPT,
  REPORT_GENERATION_PROMPT,
} from './ai-provider.interface';
import { AiProviderFactory } from './ai-provider.factory';

export class ClaudeProvider implements IAiProvider {
  readonly name = 'claude';
  private client: Anthropic;
  private chatModel = 'claude-sonnet-4-20250514';

  constructor() {
    this.client = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
  }

  async classifyThreat(logLine: string, context?: string): Promise<ThreatClassification> {
    const userMessage = context
      ? `Context: ${context}\n\nLog line:\n${logLine}`
      : `Log line:\n${logLine}`;

    const response = await this.client.messages.create({
      model: this.chatModel,
      max_tokens: 1024,
      system: THREAT_CLASSIFICATION_PROMPT,
      messages: [
        { role: 'user', content: userMessage },
      ],
    });

    const textBlock = response.content.find((block) => block.type === 'text');
    if (!textBlock || textBlock.type !== 'text') {
      throw new Error('Claude returned empty response for threat classification');
    }

    // Extract JSON from response — Claude may wrap it in markdown code blocks
    let jsonStr = textBlock.text.trim();
    const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      jsonStr = jsonMatch[1].trim();
    }

    const parsed = JSON.parse(jsonStr) as ThreatClassification;
    return {
      severity: parsed.severity || 'info',
      category: parsed.category || 'unknown',
      summary: parsed.summary || 'No summary available',
      indicators: parsed.indicators || [],
      confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 0.5,
    };
  }

  async generateEmbedding(text: string): Promise<number[]> {
    // Claude doesn't have an embedding API — delegate to EMBEDDING_PROVIDER
    const embeddingProvider = process.env.EMBEDDING_PROVIDER || 'openai';

    if (embeddingProvider === 'claude') {
      // Prevent infinite recursion — fall back to openai
      console.warn('Claude has no embedding API. Falling back to OpenAI for embeddings.');
      const fallback = AiProviderFactory.createEmbeddingProvider('openai');
      return fallback.generateEmbedding(text);
    }

    const provider = AiProviderFactory.createEmbeddingProvider(embeddingProvider);
    return provider.generateEmbedding(text);
  }

  async generateReport(incident: IncidentData): Promise<string> {
    const incidentContext = `
Incident ID: ${incident.id}
Source: ${incident.source}
Severity: ${incident.severity}
Category: ${incident.category}
Confidence: ${incident.confidence || 'N/A'}
Created At: ${incident.createdAt.toISOString()}
Raw Log: ${incident.rawLog}
AI Summary: ${incident.aiSummary || 'N/A'}
Indicators: ${JSON.stringify(incident.indicators || [])}
    `.trim();

    const response = await this.client.messages.create({
      model: this.chatModel,
      max_tokens: 2000,
      system: REPORT_GENERATION_PROMPT,
      messages: [
        {
          role: 'user',
          content: `Generate an incident report for:\n\n${incidentContext}`,
        },
      ],
    });

    const textBlock = response.content.find((block) => block.type === 'text');
    if (!textBlock || textBlock.type !== 'text') {
      throw new Error('Claude returned empty response for report generation');
    }

    return textBlock.text;
  }
}
