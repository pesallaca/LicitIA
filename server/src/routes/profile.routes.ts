import { Router } from 'express';
import { z } from 'zod';
import { authMiddleware } from '../middleware/auth.js';
import { getProfile, upsertProfile } from '../services/matching.service.js';
import { getQuotaStatus } from '../services/plan.service.js';
import { getUserById, isUserAdmin } from '../services/auth.service.js';

const router = Router();

const profileSchema = z.object({
  cpvPrefixes: z.string().max(200).regex(/^[0-9,\s]*$/, 'Los CPV son códigos numéricos separados por comas').default(''),
  keywords: z.string().max(300).default(''),
  minBudget: z.number().nonnegative().nullable().optional(),
  maxBudget: z.number().nonnegative().nullable().optional(),
});

// GET /api/profile — perfil de empresa del usuario
router.get('/', authMiddleware, (req, res) => {
  const profile = getProfile(req.userId!);
  res.json({
    profile: profile ?? { cpv_prefixes: '', keywords: '', min_budget: null, max_budget: null },
  });
});

// PUT /api/profile — guardar perfil de empresa
router.put('/', authMiddleware, (req, res) => {
  try {
    const body = profileSchema.parse(req.body);
    if (body.minBudget != null && body.maxBudget != null && body.minBudget > body.maxBudget) {
      res.status(400).json({ error: 'El presupuesto mínimo no puede superar al máximo' });
      return;
    }
    upsertProfile(req.userId!, {
      cpv_prefixes: body.cpvPrefixes.replace(/\s+/g, ''),
      keywords: body.keywords.trim(),
      min_budget: body.minBudget ?? null,
      max_budget: body.maxBudget ?? null,
    });
    res.json({ profile: getProfile(req.userId!) });
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: err.errors[0].message });
      return;
    }
    res.status(500).json({ error: 'No se pudo guardar el perfil' });
  }
});

// GET /api/profile/usage — plan y consumo del mes (para mostrar en la UI)
router.get('/usage', authMiddleware, (req, res) => {
  const user = getUserById(req.userId!);
  if (!user) {
    res.status(404).json({ error: 'Usuario no encontrado' });
    return;
  }
  const quota = getQuotaStatus(user.id, user.plan, isUserAdmin(user.id));
  res.json({ usage: quota });
});

export default router;
