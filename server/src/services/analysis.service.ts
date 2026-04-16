import { getDb } from '../db/connection.js';
import { getLLMProvider } from './llm.service.js';
import type { LLMMessage, LLMResponse } from './llm-providers/base.js';

export const ANALYZE_TENDER_PROMPT = `
# PROMPT MAESTRO – ANÁLISIS ESTRATÉGICO DE PLIEGOS DE CONTRATACIÓN PÚBLICA (ESPAÑA)

Actúa como:
- Experto en contratación pública española.
- Especialista en análisis estratégico de licitaciones.
- Consultor de negocio para PYMES.
- Experto en detección de riesgos jurídicos.
- Analista de viabilidad económica.

Analiza el pliego completo (PCAP, PPT, anexos y documentación vinculada) y genera un INFORME ESTRATÉGICO PROFESIONAL estructurado con los siguientes bloques:

1️⃣ FICHA EJECUTIVA DEL CONTRATO
2️⃣ ANÁLISIS DE IDONEIDAD PARA EL CLIENTE
3️⃣ ANÁLISIS DE CRITERIOS DE ADJUDICACIÓN
4️⃣ ANÁLISIS ECONÓMICO Y RENTABILIDAD
5️⃣ DETECCIÓN DE RIESGOS JURÍDICOS
6️⃣ ANÁLISIS DEL ÓRGANO DE CONTRATACIÓN
7️⃣ ANÁLISIS DE COMPETENCIA PROBABLE
8️⃣ MATRIZ DE DECISIÓN FINAL
9️⃣ PLAN DE ACCIÓN SI SE DECIDE LICITAR
🔟 RESUMEN EJECUTIVO PARA GERENCIA (1 PÁGINA)

FORMATO DE SALIDA: Markdown claro y estructurado. Aporta análisis estratégico real y conclusiones accionables.
`;

interface AnalysisInput {
  userId: number;
  inputType: 'text' | 'url' | 'file';
  text?: string;
  url?: string;
  fileName?: string;
}

export interface AnalysisRow {
  id: number;
  user_id: number;
  title: string | null;
  input_type: string;
  input_content: string | null;
  file_name: string | null;
  result_markdown: string | null;
  llm_provider: string;
  llm_model: string;
  tokens_used: number | null;
  duration_ms: number | null;
  created_at: string;
}

export function createAnalysisRecord(input: AnalysisInput): number {
  const db = getDb();
  const content = input.text || input.url || null;
  const result = db.prepare(
    'INSERT INTO analyses (user_id, input_type, input_content, file_name) VALUES (?, ?, ?, ?)'
  ).run(input.userId, input.inputType, content, input.fileName || null);
  return Number(result.lastInsertRowid);
}

export function updateAnalysisResult(id: number, markdown: string, meta: Partial<LLMResponse>): void {
  const db = getDb();
  // Extraer título de la primera línea markdown
  const titleMatch = markdown.match(/^#\s+(.+)/m);
  const title = titleMatch ? titleMatch[1].slice(0, 200) : 'Análisis sin título';

  db.prepare(
    'UPDATE analyses SET result_markdown = ?, title = ?, llm_provider = ?, llm_model = ?, tokens_used = ?, duration_ms = ? WHERE id = ?'
  ).run(markdown, title, meta.provider || null, meta.model || null, meta.tokensUsed || null, meta.durationMs || null, id);
}

export function getAnalysesByUser(userId: number, page = 1, limit = 20): { analyses: AnalysisRow[]; total: number } {
  const db = getDb();
  const offset = (page - 1) * limit;
  const analyses = db.prepare(
    'SELECT * FROM analyses WHERE user_id = ? AND result_markdown IS NOT NULL ORDER BY created_at DESC LIMIT ? OFFSET ?'
  ).all(userId, limit, offset) as AnalysisRow[];
  const { total } = db.prepare('SELECT COUNT(*) as total FROM analyses WHERE user_id = ? AND result_markdown IS NOT NULL').get(userId) as { total: number };
  return { analyses, total };
}

export function getAnalysisById(id: number, userId: number): AnalysisRow | null {
  const db = getDb();
  return (db.prepare('SELECT * FROM analyses WHERE id = ? AND user_id = ?').get(id, userId) as AnalysisRow) || null;
}

export function getAnalysisByIdPublic(id: number): AnalysisRow | null {
  const db = getDb();
  return (db.prepare('SELECT * FROM analyses WHERE id = ?').get(id) as AnalysisRow) || null;
}

export function deleteAnalysis(id: number, userId: number): boolean {
  const db = getDb();
  const result = db.prepare('DELETE FROM analyses WHERE id = ? AND user_id = ?').run(id, userId);
  return result.changes > 0;
}

export function buildMessages(input: AnalysisInput): LLMMessage[] {
  const messages: LLMMessage[] = [
    { role: 'system', content: ANALYZE_TENDER_PROMPT },
  ];

  const parts: string[] = [];

  if (input.url) {
    parts.push(`ENLACE AL PLIEGO: ${input.url}`);
    parts.push('NOTA: Eres un modelo local y NO puedes acceder a URLs. Analiza únicamente el texto proporcionado a continuación. Si no se proporciona texto, indica que necesitas el contenido del pliego pegado directamente.');
  }

  if (input.text && input.text.trim().length > 0) {
    parts.push(`CONTENIDO DEL PLIEGO A ANALIZAR:\n\n${input.text}`);
  }

  if (parts.length === 0) {
    parts.push('ERROR: No se ha proporcionado ningún contenido para analizar. Solicita al usuario que pegue el texto del pliego.');
  }

  const userContent = parts.join('\n\n---\n\n');
  messages.push({ role: 'user', content: userContent });

  // Debug: mostrar en consola lo que se envía al LLM
  console.log('[Analysis] ====== PROMPT DEBUG ======');
  console.log(`[Analysis] Provider: ${input.inputType}`);
  console.log(`[Analysis] System prompt: ${ANALYZE_TENDER_PROMPT.length} chars`);
  console.log(`[Analysis] User content: ${userContent.length} chars`);
  console.log(`[Analysis] Primeros 500 chars del contenido usuario:`);
  console.log(userContent.slice(0, 500));
  console.log('[Analysis] ============================');

  return messages;
}
