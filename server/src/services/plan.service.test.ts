import { describe, it, expect } from 'vitest';
import { computeQuota, normalizePlan } from './plan.service.js';

describe('computeQuota (planes y cuota mensual)', () => {
  it('plan free: 5 análisis al mes', () => {
    expect(computeQuota('free', 0, false).allowed).toBe(true);
    expect(computeQuota('free', 4, false).allowed).toBe(true);
    expect(computeQuota('free', 5, false).allowed).toBe(false);
    expect(computeQuota('free', 3, false).remaining).toBe(2);
  });

  it('plan pro: 100 análisis al mes', () => {
    expect(computeQuota('pro', 99, false).allowed).toBe(true);
    expect(computeQuota('pro', 100, false).allowed).toBe(false);
  });

  it('un admin nunca tiene límite', () => {
    expect(computeQuota('free', 10000, true).allowed).toBe(true);
  });

  it('planes desconocidos o nulos degradan a free (nunca rompe)', () => {
    expect(normalizePlan(null)).toBe('free');
    expect(normalizePlan('enterprise-inventado')).toBe('free');
    expect(computeQuota(undefined, 5, false).allowed).toBe(false);
  });
});
