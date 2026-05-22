import { GoogleGenerativeAI } from '@google/generative-ai';
import {
  IAiProvider,
  ThreatClassification,
  IncidentData,
  THREAT_CLASSIFICATION_PROMPT,
  REPORT_GENERATION_PROMPT,
} from './ai-provider.interface';

export class GeminiProvider implements IAiProvider {
  readonly name = 'gemini';
  private genAI: GoogleGenerativeAI;
  private chatModel = 'gemini-2.0-flash';
  private embeddingModel = 'text-embedding-004';

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is not set');
    }
    this.genAI = new GoogleGenerativeAI(apiKey);
  }

  async classifyThreat(logLine: string, context?: string): Promise<ThreatClassification> {
    const model = this.genAI.getGenerativeModel({
      model: this.chatModel,
      generationConfig: {
        temperature: 0.1,
        responseMimeType: 'application/json',
      },
    });

    const userMessage = context
      ? `Context: ${context}\n\nLog line:\n${logLine}`
      : `Log line:\n${logLine}`;

    const result = await model.generateContent([
      THREAT_CLASSIFICATION_PROMPT + '\n\n' + userMessage,
    ]);

    const content = result.response.text();
    if (!content) {
      throw new Error('Gemini returned empty response for threat classification');
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
    const model = this.genAI.getGenerativeModel({ model: this.embeddingModel });
    const result = await model.embedContent(text);

    const embedding = result.embedding.values;

    // Pad to 1536 dims if EMBEDDING_DIMS is set to 1536 (Gemini returns 768)
    const targetDims = parseInt(process.env.EMBEDDING_DIMS || '1536', 10);
    if (embedding.length < targetDims) {
      return [...embedding, ...new Array(targetDims - embedding.length).fill(0)];
    }

    return embedding.slice(0, targetDims);
  }

  async generateReport(incident: IncidentData): Promise<string> {
    const model = this.genAI.getGenerativeModel({
      model: this.chatModel,
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: 2000,
      },
    });

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

    const result = await model.generateContent([
      REPORT_GENERATION_PROMPT + '\n\nGenerate an incident report for:\n\n' + incidentContext,
    ]);

    const content = result.response.text();
    if (!content) {
      throw new Error('Gemini returned empty response for report generation');
    }

    return content;
  }
}
