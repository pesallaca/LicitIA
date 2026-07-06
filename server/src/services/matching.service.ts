import { getDb } from '../db/connection.js';

/**
 * Matching perfil de empresa ↔ licitaciones de PLACSP.
 * El corazón del SaaS: en vez de que la PYME busque entre miles de
 * licitaciones, LicitIA le enseña las que encajan con SU perfil.
 */

export interface CompanyProfile {
  cpv_prefixes: string; // "72,79" → prefijos de código CPV separados por comas
  keywords: string;     // "mantenimiento, jardines" → palabras en el título
  min_budget: number | null;
  max_budget: number | null;
}

export interface TenderLike {
  cpv_code: string | null;
  title: string;
  budget_amount: number | null;
  status: string | null;
}

const ESTADOS_ABIERTOS = new Set(['Publicada', 'En evaluación']);

function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');
}

export function parseList(raw: string): string[] {
  return raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

/**
 * Puntuación de relevancia (lógica pura, testeable):
 *   CPV coincide con un prefijo del perfil → +3
 *   Palabra clave presente en el título   → +2 (por palabra, máx. 2)
 *   Presupuesto dentro del rango          → +1
 * 0 = no relevante. Las licitaciones cerradas no puntúan.
 */
export function scoreTender(profile: CompanyProfile, tender: TenderLike): number {
  if (tender.status && !ESTADOS_ABIERTOS.has(tender.status)) return 0;

  let score = 0;

  const prefixes = parseList(profile.cpv_prefixes);
  if (prefixes.length && tender.cpv_code) {
    const cpv = tender.cpv_code.trim();
    if (prefixes.some((p) => cpv.startsWith(p))) score += 3;
  }

  const keywords = parseList(profile.keywords).map(normalize);
  if (keywords.length) {
    const title = normalize(tender.title);
    let hits = 0;
    for (const kw of keywords) {
      if (kw && title.includes(kw)) hits++;
      if (hits >= 2) break;
    }
    score += hits * 2;
  }

  if (tender.budget_amount != null) {
    const { min_budget, max_budget } = profile;
    const dentroMin = min_budget == null || tender.budget_amount >= min_budget;
    const dentroMax = max_budget == null || tender.budget_amount <= max_budget;
    if ((min_budget != null || max_budget != null) && dentroMin && dentroMax) score += 1;
  }

  return score;
}

export function isProfileEmpty(profile: CompanyProfile): boolean {
  return (
    parseList(profile.cpv_prefixes).length === 0 &&
    parseList(profile.keywords).length === 0 &&
    profile.min_budget == null &&
    profile.max_budget == null
  );
}

// ── Persistencia del perfil ────────────────────────────────────────────────

export function getProfile(userId: number): CompanyProfile | null {
  const db = getDb();
  const row = db.prepare(
    'SELECT cpv_prefixes, keywords, min_budget, max_budget FROM company_profiles WHERE user_id = ?'
  ).get(userId) as CompanyProfile | undefined;
  return row ?? null;
}

export function upsertProfile(userId: number, profile: CompanyProfile): void {
  const db = getDb();
  db.prepare(`
    INSERT INTO company_profiles (user_id, cpv_prefixes, keywords, min_budget, max_budget, updated_at)
    VALUES (?, ?, ?, ?, ?, datetime('now'))
    ON CONFLICT(user_id) DO UPDATE SET
      cpv_prefixes = excluded.cpv_prefixes,
      keywords = excluded.keywords,
      min_budget = excluded.min_budget,
      max_budget = excluded.max_budget,
      updated_at = datetime('now')
  `).run(userId, profile.cpv_prefixes, profile.keywords, profile.min_budget, profile.max_budget);
}

// ── Licitaciones relevantes para el usuario ────────────────────────────────

export function getRelevantTenders(userId: number, limit = 20): {
  tenders: any[];
  profileMissing: boolean;
} {
  const profile = getProfile(userId);
  if (!profile || isProfileEmpty(profile)) {
    return { tenders: [], profileMissing: true };
  }

  const db = getDb();
  // Universo acotado: las 2000 más recientes (sobra para el feed de PLACSP)
  const candidates = db.prepare(
    'SELECT * FROM market_tenders ORDER BY scraped_at DESC LIMIT 2000'
  ).all() as (TenderLike & Record<string, unknown>)[];

  const scored = candidates
    .map((t) => ({ tender: t, score: scoreTender(profile, t) }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score || String(a.tender['submission_deadline'] ?? '9999').localeCompare(String(b.tender['submission_deadline'] ?? '9999')))
    .slice(0, limit);

  return {
    tenders: scored.map((x) => ({ ...x.tender, relevance: x.score })),
    profileMissing: false,
  };
}
