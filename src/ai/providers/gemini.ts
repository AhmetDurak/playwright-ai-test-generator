import { GoogleGenAI } from '@google/genai';
import type { LlmCompletionRequest, LlmProvider } from './types.ts';

export class GeminiProvider implements LlmProvider {
  readonly name = 'gemini';
  readonly model: string;
  private readonly client: GoogleGenAI;

  constructor(apiKey: string, model: string) {
    this.client = new GoogleGenAI({ apiKey });
    this.model = model;
  }

  async complete({ system, prompt, maxTokens }: LlmCompletionRequest): Promise<string> {
    const response = await this.client.models.generateContent({
      model: this.model,
      contents: prompt,
      config: {
        systemInstruction: system,
        maxOutputTokens: maxTokens,
      },
    });

    const text = response.text;
    if (!text) {
      throw new Error('Gemini returned no text content.');
    }
    return text;
  }
}
