import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { getAnalysisById } from '../services/analysis.service.js';
import { createShareToken, getSharedAnalysis } from '../services/share.service.js';

const router = Router();

// POST /api/share/:analysisId - Crear enlace compartido
router.post('/:analysisId', authMiddleware, (req, res) => {
  const analysis = getAnalysisById(parseInt(req.params.analysisId), req.userId!);
  if (!analysis) {
    res.status(404).json({ error: 'Análisis no encontrado' });
    return;
  }

  const token = createShareToken(analysis.id);
  res.json({ token, shareUrl: `/api/share/${token}` });
});

// GET /api/share/:token - Ver informe compartido (público)
router.get('/:token', (req, res) => {
  const analysis = getSharedAnalysis(req.params.token);
  if (!analysis) {
    res.status(404).json({ error: 'Informe no encontrado o expirado' });
    return;
  }

  // If Accept header wants JSON, return JSON
  if (req.headers.accept?.includes('application/json')) {
    res.json({ analysis });
    return;
  }

  // Otherwise return a simple HTML page with the markdown
  res.send(`
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${analysis.title || 'Informe LicitIA'}</title>
      <style>
        body { font-family: system-ui, sans-serif; max-width: 800px; margin: 2rem auto; padding: 0 1rem; line-height: 1.6; color: #141414; }
        h1 { text-align: center; font-style: italic; }
        .badge { text-align: center; font-size: 0.75rem; color: #666; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 2rem; }
        pre { background: #f5f5f3; padding: 1rem; overflow-x: auto; }
      </style>
    </head>
    <body>
      <h1>LicitIA</h1>
      <div class="badge">Informe Compartido • ${new Date(analysis.created_at).toLocaleDateString('es-ES')}</div>
      <div id="content"></div>
      <script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>
      <script>
        document.getElementById('content').innerHTML = marked.parse(${JSON.stringify(analysis.result_markdown || '')});
      </script>
    </body>
    </html>
  `);
});

export default router;
