import type { LLMProvider } from './llm-providers/base.js';
import { OllamaProvider } from './llm-providers/ollama.js';
import { OpenAIProvider } from './llm-providers/openai.js';
import { config } from '../config.js';

let provider: LLMProvider | null = null;

export function getLLMProvider(): LLMProvider {
  if (provider) return provider;

  if (config.LLM_PROVIDER === 'openai') {
    if (!config.OPENAI_API_KEY) throw new Error('OPENAI_API_KEY no configurada');
    provider = new OpenAIProvider(config.OPENAI_API_KEY, config.OPENAI_MODEL);
  } else {
    provider = new OllamaProvider(config.OLLAMA_URL, config.OLLAMA_MODEL);
  }

  console.log(`[LLM] Usando proveedor: ${provider.name}`);
  return provider;
}
