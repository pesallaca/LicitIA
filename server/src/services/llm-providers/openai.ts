import type { LLMProvider, LLMMessage, LLMResponse, LLMStreamCallbacks } from './base.js';

export class OpenAIProvider implements LLMProvider {
  readonly name = 'openai';
  private apiKey: string;
  private defaultModel: string;

  constructor(apiKey: string, model = 'gpt-4o-mini') {
    this.apiKey = apiKey;
    this.defaultModel = model;
  }

  async chat(messages: LLMMessage[], model?: string): Promise<LLMResponse> {
    const start = Date.now();
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: model || this.defaultModel,
        messages,
        stream: false,
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(`OpenAI error: ${err.error?.message || res.statusText}`);
    }

    const data = await res.json();
    return {
      content: data.choices[0]?.message?.content || '',
      tokensUsed: data.usage?.total_tokens,
      durationMs: Date.now() - start,
      model: model || this.defaultModel,
      provider: 'openai',
    };
  }

  async chatStream(messages: LLMMessage[], callbacks: LLMStreamCallbacks, model?: string): Promise<void> {
    const start = Date.now();
    let fullContent = '';
    let buffer = '';

    try {
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: model || this.defaultModel,
          messages,
          stream: true,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(`OpenAI error: ${err.error?.message || res.statusText}`);
      }

      const reader = res.body?.getReader();
      if (!reader) throw new Error('No se pudo leer el stream de OpenAI');

      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const events = buffer.split('\n\n');
        buffer = events.pop() || '';

        for (const event of events) {
          const lines = event.split('\n');
          for (const line of lines) {
            if (!line.startsWith('data: ')) continue;
            const data = line.slice(6).trim();
            if (!data || data === '[DONE]') continue;

            try {
              const json = JSON.parse(data);
              const delta = json.choices?.[0]?.delta?.content;
              if (typeof delta === 'string' && delta.length > 0) {
                fullContent += delta;
                callbacks.onChunk(delta);
                continue;
              }

              const text = json.choices?.[0]?.message?.content;
              if (typeof text === 'string' && text.length > 0) {
                fullContent += text;
                callbacks.onChunk(text);
              }
            } catch {
              fullContent += data;
              callbacks.onChunk(data);
            }
          }
        }
      }

      if (buffer.trim()) {
        const trailingLines = buffer.split('\n');
        for (const line of trailingLines) {
          if (!line.startsWith('data: ')) continue;
          const data = line.slice(6).trim();
          if (!data || data === '[DONE]') continue;
          try {
            const json = JSON.parse(data);
            const delta = json.choices?.[0]?.delta?.content ?? json.choices?.[0]?.message?.content;
            if (typeof delta === 'string' && delta.length > 0) {
              fullContent += delta;
              callbacks.onChunk(delta);
            }
          } catch {
            fullContent += data;
            callbacks.onChunk(data);
          }
        }
      }

      callbacks.onDone({
        content: fullContent,
        durationMs: Date.now() - start,
        model: model || this.defaultModel,
        provider: 'openai',
      });
    } catch (err) {
      callbacks.onError(err instanceof Error ? err : new Error(String(err)));
    }
  }
}
