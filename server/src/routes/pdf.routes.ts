import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { getAnalysisById } from '../services/analysis.service.js';
import { generateAnalysisPdf } from '../services/pdf.service.js';

const router = Router();

router.get('/:id', authMiddleware, (req, res) => {
  const analysis = getAnalysisById(parseInt(req.params.id), req.userId!);
  if (!analysis || !analysis.result_markdown) {
    res.status(404).json({ error: 'Análisis no encontrado' });
    return;
  }

  const pdf = generateAnalysisPdf({
    id: analysis.id,
    title: analysis.title,
    result_markdown: analysis.result_markdown,
    created_at: analysis.created_at,
  });

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="licitia-analisis-${analysis.id}.pdf"`);
  pdf.pipe(res);
});

export default router;
