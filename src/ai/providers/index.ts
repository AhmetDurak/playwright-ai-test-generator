import { AnthropicProvider } from './anthropic.ts';
import { GeminiProvider } from './gemini.ts';
import type { LlmProvider } from './types.ts';

const DEFAULT_PROVIDER = 'anthropic';
const DEFAULT_MODELS: Record<string, string> = {
  anthropic: 'claude-sonnet-4-6',
  gemini: 'gemini-2.5-flash',
};

export function createProvider(): LlmProvider {
  const providerName = (process.env.AI_PROVIDER || DEFAULT_PROVIDER).toLowerCase();

  switch (providerName) {
    case 'anthropic': {
      const apiKey = process.env.ANTHROPIC_API_KEY;
      if (!apiKey) {
        throw new Error('Missing ANTHROPIC_API_KEY. Set it in your .env file.');
      }
      return new AnthropicProvider(apiKey, process.env.ANTHROPIC_MODEL || DEFAULT_MODELS.anthropic);
    }
    case 'gemini': {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error('Missing GEMINI_API_KEY. Set it in your .env file.');
      }
      return new GeminiProvider(apiKey, process.env.GEMINI_MODEL || DEFAULT_MODELS.gemini);
    }
    default:
      throw new Error(`Unknown AI_PROVIDER "${providerName}". Supported providers: anthropic, gemini.`);
  }
}

export type { LlmProvider, LlmCompletionRequest } from './types.ts';
