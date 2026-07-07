import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export const config = {
  PORT: parseInt(process.env.PORT || '3001'),
  NODE_ENV: process.env.NODE_ENV || 'development',
  JWT_SECRET: process.env.JWT_SECRET || 'dev-secret-change-in-production',
  JWT_EXPIRES_IN: '7d',

  // Operación del SaaS (antes hardcodeado en el código)
  MAINTENANCE_MODE: process.env.MAINTENANCE_MODE === 'true',
  ALLOW_REGISTRATION: process.env.ALLOW_REGISTRATION !== 'false',
  // Origen del frontend en producción (CORS). Vacío = solo mismo origen.
  FRONTEND_ORIGIN: process.env.FRONTEND_ORIGIN || '',
  // Límite de caracteres del pliego enviado al LLM.
  // Calibrado para el free tier de Groq (12k TPM): el español tokeniza a
  // ~3 chars/token, así que 30k chars + prompt ≈ 10-11k tokens con margen.
  // Con un tier de pago se puede subir vía env sin tocar código.
  MAX_TENDER_CHARS: parseInt(process.env.MAX_TENDER_CHARS || '30000'),
  // Caducidad de los enlaces compartidos (días)
  SHARE_EXPIRY_DAYS: parseInt(process.env.SHARE_EXPIRY_DAYS || '30'),

  // LLM
  LLM_PROVIDER: (process.env.LLM_PROVIDER || 'ollama') as 'ollama' | 'openai',
  OLLAMA_URL: process.env.OLLAMA_URL || 'http://localhost:11434',
  OLLAMA_MODEL: process.env.OLLAMA_MODEL || 'llama3.1:8b',
  OPENAI_API_KEY: process.env.OPENAI_API_KEY || '',
  OPENAI_MODEL: process.env.OPENAI_MODEL || 'gpt-4o-mini',
  // API compatible con OpenAI (Featherless, Groq...) cambiando solo la URL
  OPENAI_BASE_URL: process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1',

  // DB
  DB_PATH: process.env.DB_PATH || path.resolve(__dirname, '../data/licitia.db'),
};
