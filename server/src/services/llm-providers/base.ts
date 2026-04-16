export interface LLMMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface LLMResponse {
  content: string;
  tokensUsed?: number;
  durationMs: number;
  model: string;
  provider: string;
}

export interface LLMStreamCallbacks {
  onChunk: (text: string) => void;
  onDone: (response: LLMResponse) => void;
  onError: (error: Error) => void;
}

export interface LLMProvider {
  readonly name: string;
  chat(messages: LLMMessage[], model?: string): Promise<LLMResponse>;
  chatStream(messages: LLMMessage[], callbacks: LLMStreamCallbacks, model?: string): Promise<void>;
}
