import { Injectable } from '@nestjs/common';
import { IAiProvider, ThreatClassification, IncidentData } from './providers/ai-provider.interface';
import { AiProviderFactory } from './providers/ai-provider.factory';

@Injectable()
export class AiService {
  private chatProvider: IAiProvider;
  private embeddingProvider: IAiProvider;

  constructor() {
    this.chatProvider = AiProviderFactory.create();
    this.embeddingProvider = AiProviderFactory.createEmbeddingProvider();

    console.log(`✓ AI Provider: ${this.chatProvider.name} (chat)`);
    console.log(`✓ AI Provider: ${this.embeddingProvider.name} (embeddings)`);
  }

  get providerName(): string {
    return this.chatProvider.name;
  }

  get embeddingProviderName(): string {
    return this.embeddingProvider.name;
  }

  async classifyThreat(logLine: string, context?: string): Promise<ThreatClassification> {
    return this.chatProvider.classifyThreat(logLine, context);
  }

  async generateEmbedding(text: string): Promise<number[]> {
    return this.embeddingProvider.generateEmbedding(text);
  }

  async generateReport(incident: IncidentData): Promise<string> {
    return this.chatProvider.generateReport(incident);
  }
}
