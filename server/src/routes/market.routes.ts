import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { getMarketTenders, getMarketStats, scrapeAndSave } from '../services/scraper.service.js';

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

// GET /api/market/stats
router.get('/stats', authMiddleware, (_req, res) => {
  const stats = getMarketStats();
  res.json(stats);
});

// POST /api/market/scrape - Trigger manual
router.post('/scrape', authMiddleware, async (_req, res) => {
  try {
    const count = await scrapeAndSave();
    res.json({ message: `Scraping completado: ${count} licitaciones procesadas`, count });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
