import OpenAI from 'openai';
import {
  IAiProvider,
  ThreatClassification,
  IncidentData,
  THREAT_CLASSIFICATION_PROMPT,
  REPORT_GENERATION_PROMPT,
} from './ai-provider.interface';

export class OpenAiProvider implements IAiProvider {
  readonly name = 'openai';
  private client: OpenAI;
  private chatModel = 'gpt-4o';
  private embeddingModel = 'text-embedding-3-small';

  constructor() {
    this.client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  async classifyThreat(logLine: string, context?: string): Promise<ThreatClassification> {
    const userMessage = context
      ? `Context: ${context}\n\nLog line:\n${logLine}`
      : `Log line:\n${logLine}`;

    const response = await this.client.chat.completions.create({
      model: this.chatModel,
      messages: [
        { role: 'system', content: THREAT_CLASSIFICATION_PROMPT },
        { role: 'user', content: userMessage },
      ],
      temperature: 0.1,
      response_format: { type: 'json_object' },
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('OpenAI returned empty response for threat classification');
    }

    const parsed = JSON.parse(content) as ThreatClassification;
    return {
      severity: parsed.severity || 'info',
      category: parsed.category || 'unknown',
      summary: parsed.summary || 'No summary available',
      indicators: parsed.indicators || [],
      confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 0.5,
    };
  }

  async generateEmbedding(text: string): Promise<number[]> {
    const response = await this.client.embeddings.create({
      model: this.embeddingModel,
      input: text,
    });

    return response.data[0].embedding;
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

    const response = await this.client.chat.completions.create({
      model: this.chatModel,
      messages: [
        { role: 'system', content: REPORT_GENERATION_PROMPT },
        { role: 'user', content: `Generate an incident report for:\n\n${incidentContext}` },
      ],
      temperature: 0.3,
      max_tokens: 2000,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('OpenAI returned empty response for report generation');
    }

    return content;
  }
}
