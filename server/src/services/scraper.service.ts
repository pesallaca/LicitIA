import { XMLParser } from 'fast-xml-parser';
import { getDb } from '../db/connection.js';

const PLACSP_ATOM_URL = 'https://contrataciondelestado.es/sindicacion/sindicacion_643/licitacionesPerique/atom';

interface ScrapedTender {
  external_id: string;
  title: string;
  contracting_body: string | null;
  contract_type: string | null;
  procedure_type: string | null;
  budget_amount: number | null;
  submission_deadline: string | null;
  status: string | null;
  cpv_code: string | null;
  source_url: string | null;
}

export async function scrapeFromAtomFeed(): Promise<ScrapedTender[]> {
  try {
    const res = await fetch(PLACSP_ATOM_URL, {
      headers: {
        'User-Agent': 'LicitIA/1.0 (Herramienta de análisis de licitaciones)',
        'Accept': 'application/atom+xml, application/xml, text/xml',
      },
      signal: AbortSignal.timeout(30000),
    });

    if (!res.ok) {
      console.warn(`[Scraper] ATOM feed respondió con ${res.status}`);
      return [];
    }

    const xml = await res.text();
    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '@_',
    });
    const feed = parser.parse(xml);

    const entries = feed?.feed?.entry;
    if (!entries) return [];

    const items = Array.isArray(entries) ? entries : [entries];

    return items.map((entry: any) => {
      const id = entry.id || entry['@_id'] || crypto.randomUUID();
      const title = typeof entry.title === 'string' ? entry.title : entry.title?.['#text'] || 'Sin título';
      const summary = typeof entry.summary === 'string' ? entry.summary : entry.summary?.['#text'] || '';
      const link = Array.isArray(entry.link)
        ? entry.link.find((l: any) => l['@_rel'] === 'alternate')?.['@_href'] || entry.link[0]?.['@_href']
        : entry.link?.['@_href'] || null;

      // Try to extract info from summary/content
      const budgetMatch = summary.match(/(\d[\d.,]+)\s*€/);
      const cpvMatch = summary.match(/CPV[:\s]*(\d+)/i);

      return {
        external_id: String(id).slice(0, 200),
        title: title.slice(0, 500),
        contracting_body: extractField(summary, 'Órgano') || extractField(summary, 'Organismo'),
        contract_type: extractField(summary, 'Tipo de contrato') || extractField(summary, 'Tipo'),
        procedure_type: extractField(summary, 'Procedimiento'),
        budget_amount: budgetMatch ? parseFloat(budgetMatch[1].replace(/\./g, '').replace(',', '.')) : null,
        submission_deadline: entry.updated || null,
        status: 'open',
        cpv_code: cpvMatch ? cpvMatch[1] : null,
        source_url: link,
      };
    });
  } catch (err) {
    console.error('[Scraper] Error al obtener ATOM feed:', err);
    return [];
  }
}

function extractField(text: string, fieldName: string): string | null {
  const regex = new RegExp(`${fieldName}[:\\s]+([^\\n<;]+)`, 'i');
  const match = text.match(regex);
  return match ? match[1].trim().slice(0, 300) : null;
}

export async function scrapeAndSave(): Promise<number> {
  const tenders = await scrapeFromAtomFeed();
  if (tenders.length === 0) return 0;

  const db = getDb();
  const stmt = db.prepare(`
    INSERT INTO market_tenders (external_id, title, contracting_body, contract_type, procedure_type, budget_amount, submission_deadline, status, cpv_code, source_url)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(external_id) DO UPDATE SET
      title = excluded.title,
      contracting_body = excluded.contracting_body,
      budget_amount = excluded.budget_amount,
      status = excluded.status,
      scraped_at = datetime('now')
  `);

  const insertMany = db.transaction((items: ScrapedTender[]) => {
    let count = 0;
    for (const t of items) {
      stmt.run(t.external_id, t.title, t.contracting_body, t.contract_type, t.procedure_type, t.budget_amount, t.submission_deadline, t.status, t.cpv_code, t.source_url);
      count++;
    }
    return count;
  });

  const count = insertMany(tenders);
  console.log(`[Scraper] ${count} licitaciones guardadas/actualizadas`);
  return count;
}

export function getMarketTenders(filters: { cpv?: string; type?: string; page?: number; limit?: number }) {
  const db = getDb();
  const page = filters.page || 1;
  const limit = filters.limit || 20;
  const offset = (page - 1) * limit;

  let where = '1=1';
  const params: any[] = [];

  if (filters.cpv) {
    where += ' AND cpv_code LIKE ?';
    params.push(`%${filters.cpv}%`);
  }
  if (filters.type) {
    where += ' AND contract_type LIKE ?';
    params.push(`%${filters.type}%`);
  }

  params.push(limit, offset);

  const tenders = db.prepare(
    `SELECT * FROM market_tenders WHERE ${where} ORDER BY scraped_at DESC LIMIT ? OFFSET ?`
  ).all(...params);

  const { total } = db.prepare(
    `SELECT COUNT(*) as total FROM market_tenders WHERE ${where.replace(/ LIMIT.*/, '')}`
  ).get(...params.slice(0, -2)) as { total: number };

  return { tenders, total };
}

export function getMarketStats() {
  const db = getDb();

  const totalOpen = (db.prepare("SELECT COUNT(*) as c FROM market_tenders WHERE status = 'open'").get() as any)?.c || 0;
  const avgBudget = (db.prepare("SELECT AVG(budget_amount) as avg FROM market_tenders WHERE budget_amount IS NOT NULL").get() as any)?.avg || 0;
  const byType = db.prepare("SELECT contract_type as type, COUNT(*) as count FROM market_tenders WHERE contract_type IS NOT NULL GROUP BY contract_type ORDER BY count DESC LIMIT 10").all();
  const byProcedure = db.prepare("SELECT procedure_type as type, COUNT(*) as count FROM market_tenders WHERE procedure_type IS NOT NULL GROUP BY procedure_type ORDER BY count DESC LIMIT 10").all();
  const lastScraped = (db.prepare("SELECT MAX(scraped_at) as last FROM market_tenders").get() as any)?.last || null;

  return { totalOpen, avgBudget: Math.round(avgBudget), byType, byProcedure, lastScraped };
}

let scrapeInterval: ReturnType<typeof setInterval> | null = null;

export function startScraperSchedule(): void {
  // Scrape on startup
  scrapeAndSave().catch(console.error);
  // Then every 6 hours
  scrapeInterval = setInterval(() => {
    scrapeAndSave().catch(console.error);
  }, 6 * 60 * 60 * 1000);
  console.log('[Scraper] Programado cada 6 horas');
}
