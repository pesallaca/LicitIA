import type { LLMProvider, LLMMessage, LLMResponse, LLMStreamCallbacks } from './base.js';

export class OllamaProvider implements LLMProvider {
  readonly name = 'ollama';
  private baseUrl: string;
  private defaultModel: string;

  constructor(baseUrl = 'http://localhost:11434', model = 'llama3.1:8b') {
    this.baseUrl = baseUrl;
    this.defaultModel = model;
  }

  async chat(messages: LLMMessage[], model?: string): Promise<LLMResponse> {
    const start = Date.now();
    const res = await fetch(`${this.baseUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: model || this.defaultModel,
        messages,
        stream: false,
      }),
    });

    if (!res.ok) throw new Error(`Ollama error: ${res.statusText}`);

    const data = await res.json();
    return {
      content: data.message?.content || '',
      tokensUsed: data.eval_count,
      durationMs: Date.now() - start,
      model: model || this.defaultModel,
      provider: 'ollama',
    };
  }

  async chatStream(messages: LLMMessage[], callbacks: LLMStreamCallbacks, model?: string): Promise<void> {
    const start = Date.now();
    let fullContent = '';
    let tokensUsed: number | undefined;

    try {
      const res = await fetch(`${this.baseUrl}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: model || this.defaultModel,
          messages,
          stream: true,
        }),
      });

      if (!res.ok) throw new Error(`Ollama error: ${res.statusText}`);

      const reader = res.body?.getReader();
      if (!reader) throw new Error('No se pudo leer el stream de Ollama');

      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        // Ollama streams ndjson lines
        const lines = chunk.split('\n').filter(Boolean);

        for (const line of lines) {
          const json = JSON.parse(line);
          if (json.message?.content) {
            fullContent += json.message.content;
            callbacks.onChunk(json.message.content);
          }
          if (json.done) {
            tokensUsed = json.eval_count;
          }
        }
      }

      callbacks.onDone({
        content: fullContent,
        tokensUsed,
        durationMs: Date.now() - start,
        model: model || this.defaultModel,
        provider: 'ollama',
      });
    } catch (err) {
      callbacks.onError(err instanceof Error ? err : new Error(String(err)));
    }
  }
}
