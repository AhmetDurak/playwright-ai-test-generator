export interface LlmCompletionRequest {
  system: string;
  prompt: string;
  maxTokens: number;
}

export interface LlmProvider {
  readonly name: string;
  readonly model: string;
  complete(request: LlmCompletionRequest): Promise<string>;
}
