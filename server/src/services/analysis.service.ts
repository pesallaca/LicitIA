import { getDb } from '../db/connection.js';
import { getLLMProvider } from './llm.service.js';
import type { LLMMessage, LLMResponse } from './llm-providers/base.js';

/**
 * Construye el prompt completo con el pliego incrustado.
 * Para modelos pequeños (llama3.1:8b) es crítico que todo vaya en un solo
 * bloque de texto, no separado en system/user, porque tienden a ignorar
 * el system prompt y dan respuestas genéricas.
 */
export function buildAnalysisPrompt(tenderContent: string): string {
  return `Eres un consultor experto en contratación pública española con 20 años de experiencia. Tu especialidad es analizar pliegos de licitación (PCAP, PPT) y dar recomendaciones estratégicas a PYMES que quieren presentarse.

A continuación te proporciono el TEXTO COMPLETO de un pliego de licitación real. Léelo con atención y genera un INFORME ESTRATÉGICO detallado basándote EXCLUSIVAMENTE en los datos concretos que aparecen en el pliego. NO inventes datos que no estén en el texto. Si un dato no aparece, indica "No especificado en el pliego".

========== INICIO DEL PLIEGO ==========
${tenderContent}
========== FIN DEL PLIEGO ==========

Ahora genera el informe estratégico con EXACTAMENTE estos bloques, usando los datos reales del pliego anterior:

## 1. FICHA EJECUTIVA DEL CONTRATO
(Objeto, presupuesto base, valor estimado, duración, prórrogas, procedimiento, CPV, órgano de contratación)

## 2. ANÁLISIS DE IDONEIDAD
(¿Es adecuado para una PYME? ¿Qué perfil de empresa encaja? Requisitos de solvencia técnica y económica)

## 3. ANÁLISIS DE CRITERIOS DE ADJUDICACIÓN
(Desglose de puntuación: criterios automáticos vs juicio de valor, peso del precio vs técnica, estrategia recomendada)

## 4. ANÁLISIS ECONÓMICO Y RENTABILIDAD
(Presupuesto, márgenes estimados, riesgos de baja temeraria, revisión de precios)

## 5. DETECCIÓN DE RIESGOS JURÍDICOS
(Penalidades, garantías, subcontratación, cláusulas problemáticas)

## 6. ANÁLISIS DE COMPETENCIA PROBABLE
(Tipo de empresas que se presentarán, barreras de entrada, nivel de competencia esperado)

## 7. RECOMENDACIÓN FINAL
(¿Presentarse o no? Justificación con datos del pliego. Puntos fuertes y débiles de la oportunidad)

Formato: Markdown estructurado. Usa los datos EXACTOS del pliego (cifras, plazos, porcentajes).`;
}

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
  let tenderContent = '';

  if (input.url) {
    tenderContent += `[Enlace proporcionado: ${input.url} — el modelo no puede acceder a URLs, se analiza el texto pegado]\n\n`;
  }

  if (input.text && input.text.trim().length > 0) {
    tenderContent += input.text;
  }

  if (!tenderContent.trim()) {
    tenderContent = 'ERROR: No se ha proporcionado contenido del pliego. El usuario debe pegar el texto completo.';
  }

  // Prompt unificado: instrucciones + pliego en un solo bloque
  const fullPrompt = buildAnalysisPrompt(tenderContent);

  // Para Ollama usamos un solo mensaje user con todo el contenido.
  // Para OpenAI se podría separar en system+user, pero el prompt unificado
  // funciona igual de bien y mantiene consistencia.
  const messages: LLMMessage[] = [
    { role: 'user', content: fullPrompt },
  ];

  // Debug
  console.log('[Analysis] ====== PROMPT DEBUG ======');
  console.log(`[Analysis] Input type: ${input.inputType}`);
  console.log(`[Analysis] Texto del pliego: ${tenderContent.length} chars`);
  console.log(`[Analysis] Prompt total (con instrucciones): ${fullPrompt.length} chars`);
  console.log(`[Analysis] Estructura: 1 mensaje user con prompt unificado`);
  console.log(`[Analysis] Primeros 300 chars del pliego:`);
  console.log(tenderContent.slice(0, 300));
  console.log('[Analysis] ============================');

  return messages;
}
