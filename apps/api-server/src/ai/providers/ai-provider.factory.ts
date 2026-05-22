import { IAiProvider } from './ai-provider.interface';
import { OpenAiProvider } from './openai.provider';
import { GeminiProvider } from './gemini.provider';
import { ClaudeProvider } from './claude.provider';

export class AiProviderFactory {
  private static providers: Map<string, IAiProvider> = new Map();

  /**
   * Create or retrieve the main AI provider based on AI_PROVIDER env var.
   */
  static create(providerName?: string): IAiProvider {
    const name = (providerName || process.env.AI_PROVIDER || 'openai').toLowerCase();

    if (this.providers.has(name)) {
      return this.providers.get(name)!;
    }

    const provider = this.instantiate(name);
    this.providers.set(name, provider);
    return provider;
  }

  /**
   * Create a provider specifically for embedding generation.
   * Used by ClaudeProvider to delegate embeddings to another provider.
   */
  static createEmbeddingProvider(providerName?: string): IAiProvider {
    const name = (providerName || process.env.EMBEDDING_PROVIDER || process.env.AI_PROVIDER || 'openai').toLowerCase();

    // Claude has no embedding API, always fall back to openai
    const effectiveName = name === 'claude' ? 'openai' : name;

    const cacheKey = `embedding_${effectiveName}`;
    if (this.providers.has(cacheKey)) {
      return this.providers.get(cacheKey)!;
    }

    const provider = this.instantiate(effectiveName);
    this.providers.set(cacheKey, provider);
    return provider;
  }

  private static instantiate(name: string): IAiProvider {
    switch (name) {
      case 'openai':
        return new OpenAiProvider();
      case 'gemini':
        return new GeminiProvider();
      case 'claude':
        return new ClaudeProvider();
      default:
        throw new Error(
          `Unknown AI provider: "${name}". Supported: openai, gemini, claude. ` +
          `Set AI_PROVIDER env var to one of these values.`
        );
    }
  }

  /** Clear cached providers (useful for testing) */
  static reset(): void {
    this.providers.clear();
  }

  /** List available provider names */
  static get availableProviders(): string[] {
    return ['openai', 'gemini', 'claude'];
  }
}
