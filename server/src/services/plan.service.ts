import { getDb } from '../db/connection.js';

/**
 * Planes del SaaS. La cuota es mensual (mes natural).
 * Los admins no tienen límite. El plan vive en users.plan (migración v1).
 */
export const PLANS = {
  free: { label: 'Gratuito', analysesPerMonth: 5 },
  pro: { label: 'Profesional', analysesPerMonth: 100 },
} as const;

export type PlanId = keyof typeof PLANS;

export function normalizePlan(plan: string | null | undefined): PlanId {
  return plan && plan in PLANS ? (plan as PlanId) : 'free';
}

export function getMonthlyAnalysisCount(userId: number): number {
  const db = getDb();
  // Solo cuentan los análisis COMPLETADOS (con resultado): un fallo del LLM
  // no debe robarle cuota al usuario. El freno anti-ráfaga por hora sí cuenta
  // todos los intentos (getRecentAnalysisCountByUser), para evitar abuso.
  const row = db.prepare(
    `SELECT COUNT(*) as total FROM analyses
     WHERE user_id = ? AND result_markdown IS NOT NULL
       AND created_at >= datetime('now', 'start of month')`
  ).get(userId) as { total: number };
  return row.total;
}

export interface QuotaStatus {
  plan: PlanId;
  planLabel: string;
  used: number;
  limit: number;
  remaining: number;
  allowed: boolean;
}

/** Lógica pura de cuota (testeable sin BD). */
export function computeQuota(plan: string | null | undefined, used: number, isAdmin: boolean): QuotaStatus {
  const planId = normalizePlan(plan);
  const limit = isAdmin ? Number.MAX_SAFE_INTEGER : PLANS[planId].analysesPerMonth;
  const remaining = Math.max(0, limit - used);
  return {
    plan: planId,
    planLabel: PLANS[planId].label,
    used,
    limit,
    remaining,
    allowed: isAdmin || used < limit,
  };
}

export function getQuotaStatus(userId: number, plan: string | null | undefined, isAdmin: boolean): QuotaStatus {
  return computeQuota(plan, getMonthlyAnalysisCount(userId), isAdmin);
}
