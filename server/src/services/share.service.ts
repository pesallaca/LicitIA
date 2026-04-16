import crypto from 'crypto';
import { getDb } from '../db/connection.js';
import { getAnalysisByIdPublic, type AnalysisRow } from './analysis.service.js';

export function createShareToken(analysisId: number): string {
  const db = getDb();
  const token = crypto.randomUUID();
  db.prepare('INSERT INTO shared_reports (analysis_id, token) VALUES (?, ?)').run(analysisId, token);
  return token;
}

export function getSharedAnalysis(token: string): AnalysisRow | null {
  const db = getDb();
  const share = db.prepare(
    'SELECT analysis_id, expires_at FROM shared_reports WHERE token = ?'
  ).get(token) as { analysis_id: number; expires_at: string | null } | undefined;

  if (!share) return null;

  // Check expiry
  if (share.expires_at && new Date(share.expires_at) < new Date()) return null;

  return getAnalysisByIdPublic(share.analysis_id);
}
