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

    console.log('[Ollama] ====== PROMPT ENVIADO ======');
    console.log(`[Ollama] Modelo: ${model || this.defaultModel}`);
    console.log(`[Ollama] Endpoint: /api/generate (prompt unificado)`);
    console.log(`[Ollama] Largo total: ${prompt.length} chars`);
    console.log(`[Ollama] Primeros 800 chars:`);
    console.log(prompt.slice(0, 800));
    console.log('[Ollama] ==============================');

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

    console.log('[Ollama] ====== PROMPT ENVIADO (stream) ======');
    console.log(`[Ollama] Modelo: ${model || this.defaultModel}`);
    console.log(`[Ollama] Endpoint: /api/generate (prompt unificado)`);
    console.log(`[Ollama] Largo total: ${prompt.length} chars`);
    console.log(`[Ollama] Primeros 800 chars:`);
    console.log(prompt.slice(0, 800));
    console.log('[Ollama] ==========================================');

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

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n').filter(Boolean);

        for (const line of lines) {
          const json = JSON.parse(line);
          // /api/generate usa "response" en vez de "message.content"
          if (json.response) {
            fullContent += json.response;
            callbacks.onChunk(json.response);
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
