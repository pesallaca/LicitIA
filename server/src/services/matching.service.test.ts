import { describe, it, expect } from 'vitest';
import { scoreTender, parseList, isProfileEmpty, type CompanyProfile, type TenderLike } from './matching.service.js';

const perfil = (p: Partial<CompanyProfile> = {}): CompanyProfile => ({
  cpv_prefixes: '',
  keywords: '',
  min_budget: null,
  max_budget: null,
  ...p,
});

const licitacion = (t: Partial<TenderLike> = {}): TenderLike => ({
  cpv_code: null,
  title: 'Servicio genérico',
  budget_amount: null,
  status: 'Publicada',
  ...t,
});

describe('scoreTender (matching perfil ↔ licitación)', () => {
  it('CPV que empieza por un prefijo del perfil suma 3', () => {
    const p = perfil({ cpv_prefixes: '72,79' });
    expect(scoreTender(p, licitacion({ cpv_code: '72000000' }))).toBe(3);
    expect(scoreTender(p, licitacion({ cpv_code: '79510000' }))).toBe(3);
    expect(scoreTender(p, licitacion({ cpv_code: '45000000' }))).toBe(0);
  });

  it('palabra clave en el título suma 2, ignorando acentos y mayúsculas', () => {
    const p = perfil({ keywords: 'jardinería' });
    expect(scoreTender(p, licitacion({ title: 'Mantenimiento de JARDINERIA municipal' }))).toBe(2);
  });

  it('varias palabras clave acumulan hasta un máximo de 2 aciertos (4 puntos)', () => {
    const p = perfil({ keywords: 'limpieza, mantenimiento, edificios' });
    const t = licitacion({ title: 'Limpieza y mantenimiento de edificios públicos' });
    expect(scoreTender(p, t)).toBe(4);
  });

  it('presupuesto dentro del rango del perfil suma 1', () => {
    const p = perfil({ cpv_prefixes: '72', min_budget: 10000, max_budget: 100000 });
    expect(scoreTender(p, licitacion({ cpv_code: '72110000', budget_amount: 50000 }))).toBe(4);
    expect(scoreTender(p, licitacion({ cpv_code: '72110000', budget_amount: 500000 }))).toBe(3);
  });

  it('sin criterios de perfil que coincidan, la puntuación es 0', () => {
    expect(scoreTender(perfil(), licitacion())).toBe(0);
  });

  it('las licitaciones cerradas (adjudicadas/anuladas) nunca puntúan', () => {
    const p = perfil({ cpv_prefixes: '72' });
    expect(scoreTender(p, licitacion({ cpv_code: '72000000', status: 'Adjudicada' }))).toBe(0);
    expect(scoreTender(p, licitacion({ cpv_code: '72000000', status: 'Anulada' }))).toBe(0);
    expect(scoreTender(p, licitacion({ cpv_code: '72000000', status: 'En evaluación' }))).toBe(3);
  });
});

describe('parseList', () => {
  it('separa por comas, recorta espacios y descarta vacíos', () => {
    expect(parseList(' 72 , 79 ,, ')).toEqual(['72', '79']);
    expect(parseList('')).toEqual([]);
  });
});

describe('isProfileEmpty', () => {
  it('vacío cuando no hay ningún criterio', () => {
    expect(isProfileEmpty(perfil())).toBe(true);
    expect(isProfileEmpty(perfil({ cpv_prefixes: '72' }))).toBe(false);
    expect(isProfileEmpty(perfil({ min_budget: 1000 }))).toBe(false);
  });
});
