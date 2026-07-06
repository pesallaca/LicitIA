import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { getMarketTenders, getMarketStats, scrapeAndSave } from '../services/scraper.service.js';
import { getRelevantTenders } from '../services/matching.service.js';
import { isUserAdmin } from '../services/auth.service.js';

const router = Router();

// GET /api/market/tenders
router.get('/tenders', authMiddleware, (req, res) => {
  const filters = {
    cpv: req.query.cpv as string | undefined,
    type: req.query.type as string | undefined,
    page: parseInt(req.query.page as string) || 1,
    limit: parseInt(req.query.limit as string) || 20,
  };
  const result = getMarketTenders(filters);
  res.json(result);
});

// GET /api/market/relevant — licitaciones que encajan con el perfil de empresa
router.get('/relevant', authMiddleware, (req, res) => {
  // Acotado a [1, 50]: un limit negativo o NaN nunca debe llegar al slice
  const limit = Math.max(1, Math.min(parseInt(req.query.limit as string) || 20, 50));
  const result = getRelevantTenders(req.userId!, limit);
  res.json(result);
});

// GET /api/market/stats
router.get('/stats', authMiddleware, (_req, res) => {
  const stats = getMarketStats();
  res.json(stats);
});

// POST /api/market/scrape — trigger manual, SOLO admin (protege el feed de PLACSP)
router.post('/scrape', authMiddleware, async (req, res) => {
  if (!isUserAdmin(req.userId!)) {
    res.status(403).json({ error: 'Solo un administrador puede lanzar el escaneo manual. El sistema se actualiza solo cada 6 horas.' });
    return;
  }
  try {
    const count = await scrapeAndSave();
    res.json({ message: `Scraping completado: ${count} licitaciones procesadas`, count });
  } catch (err: any) {
    res.status(500).json({ error: 'No se pudo completar el escaneo. Revisa los logs del servidor.' });
  }
});

export default router;
