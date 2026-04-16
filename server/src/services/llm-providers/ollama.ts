import type { LLMProvider, LLMMessage, LLMResponse, LLMStreamCallbacks } from './base.js';

export class OllamaProvider implements LLMProvider {
  readonly name = 'ollama';
  private baseUrl: string;
  private defaultModel: string;

  constructor(baseUrl = 'http://localhost:11434', model = 'llama3.1:8b') {
    this.baseUrl = baseUrl;
    this.defaultModel = model;
  }

  /**
   * Combina mensajes system+user en un solo prompt para /api/generate.
   * Los modelos pequeños (8b) responden mucho mejor con un prompt unificado
   * que con mensajes separados via /api/chat.
   */
  private buildPrompt(messages: LLMMessage[]): string {
    const parts: string[] = [];
    for (const msg of messages) {
      if (msg.role === 'system') {
        parts.push(msg.content);
      } else if (msg.role === 'user') {
        parts.push(msg.content);
      } else if (msg.role === 'assistant') {
        parts.push(`Respuesta anterior:\n${msg.content}`);
      }
    }
    return parts.join('\n\n');
  }

  async chat(messages: LLMMessage[], model?: string): Promise<LLMResponse> {
    const start = Date.now();
    const prompt = this.buildPrompt(messages);

    console.log(`[Ollama] chat: ${prompt.length} chars, modelo: ${model || this.defaultModel}`);

    const res = await fetch(`${this.baseUrl}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: model || this.defaultModel,
        prompt,
        stream: false,
      }),
    });

    if (!res.ok) throw new Error(`Ollama error: ${res.statusText}`);

    const data = await res.json();
    return {
      content: data.response || '',
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
    const prompt = this.buildPrompt(messages);

    console.log(`[Ollama] stream: ${prompt.length} chars, modelo: ${model || this.defaultModel}`);

    try {
      const res = await fetch(`${this.baseUrl}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: model || this.defaultModel,
          prompt,
          stream: true,
        }),
      });

      if (!res.ok) throw new Error(`Ollama error: ${res.statusText}`);

      const reader = res.body?.getReader();
      if (!reader) throw new Error('No se pudo leer el stream de Ollama');

      const decoder = new TextDecoder();
      let buffer = '';  // Buffer para líneas parciales

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        // Procesar solo líneas completas (terminadas en \n)
        const lines = buffer.split('\n');
        // La última puede estar incompleta, la dejamos en el buffer
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed) continue;

          try {
            const json = JSON.parse(trimmed);
            if (json.response) {
              fullContent += json.response;
              callbacks.onChunk(json.response);
            }
            if (json.done) {
              tokensUsed = json.eval_count;
            }
          } catch {
            // Línea JSON malformada, ignorar
            console.warn(`[Ollama] JSON parse skip: ${trimmed.slice(0, 100)}`);
          }
        }
      }

      // Procesar lo que quede en el buffer
      if (buffer.trim()) {
        try {
          const json = JSON.parse(buffer.trim());
          if (json.response) {
            fullContent += json.response;
            callbacks.onChunk(json.response);
          }
          if (json.done) {
            tokensUsed = json.eval_count;
          }
        } catch {
          console.warn(`[Ollama] JSON parse final skip: ${buffer.slice(0, 100)}`);
        }
      }

      console.log(`[Ollama] Stream completado: ${fullContent.length} chars, ${tokensUsed} tokens, ${Date.now() - start}ms`);

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
