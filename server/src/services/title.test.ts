import { describe, it, expect } from 'vitest';
import { extractTitle } from './analysis.service.js';

describe('extractTitle (título del historial)', () => {
  it('usa el objeto del contrato cuando aparece', () => {
    const md = '## 1. FICHA EJECUTIVA\n- **Objeto del contrato**: Mantenimiento de jardines de Alcobendas.\n- Presupuesto...';
    expect(extractTitle(md)).toBe('Mantenimiento de jardines de Alcobendas');
  });

  it('cae al primer encabezado (con o sin numeración) si no hay objeto', () => {
    expect(extractTitle('## 2. Análisis económico\ntexto')).toBe('Análisis económico');
    expect(extractTitle('# Informe estratégico\ntexto')).toBe('Informe estratégico');
  });

  it('nunca deja el historial sin título', () => {
    expect(extractTitle('texto plano sin estructura')).toBe('Análisis de licitación');
  });
});
