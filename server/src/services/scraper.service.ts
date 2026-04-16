import { XMLParser } from 'fast-xml-parser';
import { getDb } from '../db/connection.js';

// URL correcta del feed ATOM de PLACSP (formato CODICE)
const PLACSP_ATOM_URL = 'https://contrataciondelsectorpublico.gob.es/sindicacion/sindicacion_643/licitacionesPerfilesContratanteCompleto3.atom';

// Mapeo de códigos de tipo de contrato CODICE
const CONTRACT_TYPE_MAP: Record<string, string> = {
  '1': 'Suministros',
  '2': 'Servicios',
  '3': 'Obras',
  '21': 'Gestión de Servicios Públicos',
  '31': 'Concesión de Obras Públicas',
  '40': 'Colaboración Público-Privada',
  '7': 'Administrativo Especial',
  '8': 'Privado',
};

// Mapeo de códigos de estado
const STATUS_MAP: Record<string, string> = {
  'PUB': 'Publicada',
  'EV': 'En evaluación',
  'ADJ': 'Adjudicada',
  'RES': 'Resuelta',
  'ANUL': 'Anulada',
  'DES': 'Desierta',
};

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
    console.log('[Scraper] Obteniendo feed ATOM de PLACSP...');
    const res = await fetch(PLACSP_ATOM_URL, {
      headers: {
        'User-Agent': 'LicitIA/1.0 (Herramienta de análisis de licitaciones públicas)',
        'Accept': 'application/atom+xml, application/xml, text/xml',
      },
      signal: AbortSignal.timeout(60000),
    });

    if (!res.ok) {
      console.warn(`[Scraper] ATOM feed respondió con ${res.status} ${res.statusText}`);
      return [];
    }

    const xml = await res.text();
    console.log(`[Scraper] Feed recibido: ${(xml.length / 1024).toFixed(0)} KB`);

    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '@_',
      removeNSPrefix: false,
      isArray: (name) => name === 'entry' || name === 'link',
    });
    const feed = parser.parse(xml);

    // El feed ATOM tiene la estructura: feed > entry[]
    const entries = feed?.feed?.entry;
    if (!entries || !Array.isArray(entries)) {
      console.warn('[Scraper] No se encontraron entries en el feed');
      return [];
    }

    console.log(`[Scraper] ${entries.length} entries encontradas en el feed`);

    return entries.map((entry: any) => parseCodiceEntry(entry)).filter(Boolean) as ScrapedTender[];
  } catch (err) {
    console.error('[Scraper] Error al obtener ATOM feed:', err instanceof Error ? err.message : err);
    return [];
  }
}

function parseCodiceEntry(entry: any): ScrapedTender | null {
  try {
    // ID de la licitación
    const id = entry.id || '';
    const externalId = id.match(/\/(\d+)$/)?.[1] || id;

    // Título
    const rawTitle = entry.title;
    const title = typeof rawTitle === 'string' ? rawTitle : rawTitle?.['#text'] || 'Sin título';

    // Link al detalle
    const links = Array.isArray(entry.link) ? entry.link : entry.link ? [entry.link] : [];
    const detailLink = links.find((l: any) => l['@_rel'] === 'alternate')?.['@_href']
      || links[0]?.['@_href']
      || null;

    // Summary contiene datos estructurados como texto plano
    // Formato: "Id licitacion: XXX; Organo: YYY; Importe: ZZZ EUR; Estado: AAA"
    const rawSummary = entry.summary;
    const summary = typeof rawSummary === 'string' ? rawSummary : rawSummary?.['#text'] || '';

    // Extraer campos del summary
    const organo = extractSummaryField(summary, 'Organo') || extractSummaryField(summary, 'Órgano');
    const importe = extractSummaryField(summary, 'Importe');
    const estado = extractSummaryField(summary, 'Estado');

    // Parsear importe: "54831875.93 EUR" o "1.250.000,50 EUR"
    let budgetAmount: number | null = null;
    if (importe) {
      const cleaned = importe.replace(/\s*EUR\s*/i, '').trim();
      // Si tiene formato español (1.250.000,50)
      if (cleaned.includes(',')) {
        budgetAmount = parseFloat(cleaned.replace(/\./g, '').replace(',', '.'));
      } else {
        budgetAmount = parseFloat(cleaned);
      }
      if (isNaN(budgetAmount)) budgetAmount = null;
    }

    // Buscar datos CODICE en el contenido XML del entry
    // Los campos CODICE usan namespaces como cbc:, cac:, cbc-place-ext:
    const contractFolder = findNested(entry, 'ContractFolderStatus') || entry;

    // Tipo de contrato
    const typeCode = findNested(contractFolder, 'TypeCode');
    const typeCodeStr = typeof typeCode === 'object' ? typeCode?.['#text'] : typeCode;
    const contractType = typeCodeStr ? (CONTRACT_TYPE_MAP[String(typeCodeStr)] || String(typeCodeStr)) : extractSummaryField(summary, 'Tipo');

    // Procedimiento
    const procCode = findNested(contractFolder, 'ProcedureCode');
    const procedureType = typeof procCode === 'object' ? procCode?.['#text'] : procCode || null;

    // CPV
    const cpvCode = findNested(contractFolder, 'ItemClassificationCode');
    const cpv = typeof cpvCode === 'object' ? cpvCode?.['#text'] : cpvCode || null;

    // Fecha límite
    const endDate = findNested(contractFolder, 'EndDate');
    const deadline = typeof endDate === 'object' ? endDate?.['#text'] : endDate || null;

    // Estado
    const statusCode = findNested(contractFolder, 'ContractFolderStatusCode');
    const statusStr = typeof statusCode === 'object' ? statusCode?.['#text'] : statusCode || estado;
    const status = statusStr ? (STATUS_MAP[String(statusStr)] || String(statusStr)) : 'Publicada';

    // Presupuesto desde CODICE (más preciso que el summary)
    const taxExcl = findNested(contractFolder, 'TaxExclusiveAmount');
    if (taxExcl) {
      const amount = typeof taxExcl === 'object' ? parseFloat(taxExcl?.['#text']) : parseFloat(taxExcl);
      if (!isNaN(amount)) budgetAmount = amount;
    }

    // Órgano de contratación desde CODICE
    const partyName = findNested(contractFolder, 'Name');
    const contractingBody = (typeof partyName === 'object' ? partyName?.['#text'] : partyName) || organo || null;

    return {
      external_id: String(externalId).slice(0, 200),
      title: title.slice(0, 500),
      contracting_body: contractingBody?.slice(0, 300) || null,
      contract_type: contractType?.slice(0, 100) || null,
      procedure_type: procedureType ? String(procedureType).slice(0, 100) : null,
      budget_amount: budgetAmount,
      submission_deadline: deadline || entry.updated || null,
      status,
      cpv_code: cpv ? String(cpv).slice(0, 50) : null,
      source_url: detailLink,
    };
  } catch (err) {
    console.warn('[Scraper] Error parseando entry:', err instanceof Error ? err.message : err);
    return null;
  }
}

function extractSummaryField(summary: string, fieldName: string): string | null {
  // Matches "Organo: Valor del campo;" or "Organo: Valor del campo" at end
  const regex = new RegExp(`${fieldName}\\s*:\\s*([^;]+)`, 'i');
  const match = summary.match(regex);
  return match ? match[1].trim() : null;
}

function findNested(obj: any, key: string): any {
  if (!obj || typeof obj !== 'object') return null;
  // Check all keys including namespaced ones (e.g., "cbc:TypeCode")
  for (const k of Object.keys(obj)) {
    if (k === key || k.endsWith(`:${key}`)) return obj[k];
    const found = findNested(obj[k], key);
    if (found !== null) return found;
  }
  return null;
}

export async function scrapeAndSave(): Promise<number> {
  const tenders = await scrapeFromAtomFeed();
  if (tenders.length === 0) {
    console.log('[Scraper] No se obtuvieron licitaciones');
    return 0;
  }

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

  const countParams = [...params];
  params.push(limit, offset);

  const tenders = db.prepare(
    `SELECT * FROM market_tenders WHERE ${where} ORDER BY scraped_at DESC LIMIT ? OFFSET ?`
  ).all(...params);

  const { total } = db.prepare(
    `SELECT COUNT(*) as total FROM market_tenders WHERE ${where}`
  ).get(...countParams) as { total: number };

  return { tenders, total };
}

export function getMarketStats() {
  const db = getDb();

  const totalOpen = (db.prepare("SELECT COUNT(*) as c FROM market_tenders").get() as any)?.c || 0;
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
