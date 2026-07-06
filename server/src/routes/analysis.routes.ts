import { Router } from 'express';
import { z } from 'zod';
import { authMiddleware } from '../middleware/auth.js';
import { getLLMProvider } from '../services/llm.service.js';
import {
  createAnalysisRecord,
  updateAnalysisResult,
  buildMessages,
  getAnalysesByUser,
  getAnalysisById,
  deleteAnalysis,
  getRecentAnalysisCountByUser,
} from '../services/analysis.service.js';
import { isUserAdmin, getUserById } from '../services/auth.service.js';
import { getQuotaStatus } from '../services/plan.service.js';
import { config } from '../config.js';

const router = Router();

const analysisSchema = z.object({
  inputType: z.enum(['text', 'url', 'file']),
  text: z.string().optional(),
  url: z.string().url().optional(),
  file: z.object({
    data: z.string(),
    mimeType: z.string(),
    name: z.string(),
  }).optional(),
});

// POST /api/analysis - Nuevo análisis con streaming SSE
router.post('/', authMiddleware, async (req, res) => {
  // Mantenimiento controlado por entorno (MAINTENANCE_MODE=true), nunca hardcodeado
  if (config.MAINTENANCE_MODE) {
    res.status(503).json({ error: 'Servicio en mantenimiento. El análisis está temporalmente desactivado.' });
    return;
  }

  try {
    const body = analysisSchema.parse(req.body);
    const userId = req.userId!;
    const { inputType, text, url, file } = body;

    // Validar que hay contenido real para analizar
    const hasText = (text?.trim().length ?? 0) > 0;
    const hasUrl = (url?.trim().length ?? 0) > 0;
    const hasFile = file !== undefined;
    if (!hasText && !hasFile) {
      res.status(400).json({
        error: hasUrl
          ? 'Debes pegar el texto del pliego además de la URL. El modelo no puede acceder a enlaces de internet.'
          : 'No se ha proporcionado contenido para analizar. Pega el texto del pliego en el editor.'
      });
      return;
    }

    const admin = isUserAdmin(userId);
    if (!admin) {
      // Cuota mensual según plan (free/pro) — la base de la monetización
      const user = getUserById(userId);
      const quota = getQuotaStatus(userId, user?.plan, false);
      if (!quota.allowed) {
        res.status(429).json({
          error: `Has agotado los ${quota.limit} análisis mensuales de tu plan ${quota.planLabel}. Mejora tu plan para seguir analizando.`,
          quota,
        });
        return;
      }
      // Freno de ráfaga: máx. 10 análisis/hora también en planes de pago
      const recentCount = getRecentAnalysisCountByUser(userId, 1);
      if (recentCount >= 10) {
        res.status(429).json({ error: 'Has alcanzado el límite de 10 análisis por hora. Inténtalo más tarde.' });
        return;
      }
    }

    // Crear registro en DB
    const analysisId = createAnalysisRecord({
      userId,
      inputType,
      text,
      url,
      fileName: file?.name,
    });

    // Configurar SSE
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    // Enviar ID del análisis
    res.write(`data: ${JSON.stringify({ type: 'id', analysisId })}\n\n`);

    const messages = await buildMessages({
      userId,
      inputType: body.inputType,
      text: body.text,
      url: body.url,
      fileName: body.file?.name,
      fileData: body.file?.data,
      fileMimeType: body.file?.mimeType,
    });

    const llm = getLLMProvider();

    await llm.chatStream(messages, {
      onChunk: (chunk) => {
        res.write(`data: ${chunk}\n\n`);
      },
      onDone: (response) => {
        // Solo metadatos en logs: nunca contenido del cliente
        console.log(`[Analysis] #${analysisId} completado: ${response.tokensUsed ?? '?'} tokens, ${response.durationMs ?? '?'}ms`);
        try {
          updateAnalysisResult(analysisId, response.content, response);
        } catch (err) {
          console.error(`[Analysis] ERROR al guardar análisis #${analysisId} en DB:`, err instanceof Error ? err.message : err);
        }
        res.write(`data: [DONE]\n\n`);
        res.end();
      },
      onError: (error) => {
        console.error('[Analysis] onError llamado:', error.message);
        res.write(`data: [ERROR] ${error.message}\n\n`);
        res.end();
      },
    });
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: err.errors[0].message });
      return;
    }
    console.error('[Analysis] Error inesperado:', err instanceof Error ? err.message : err);
    res.status(500).json({ error: 'No se pudo procesar el análisis. Inténtalo de nuevo.' });
  }
});

// GET /api/analysis - Listar análisis del usuario
router.get('/', authMiddleware, (req, res) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const result = getAnalysesByUser(req.userId!, page, limit);
  res.json(result);
});

// GET /api/analysis/:id - Detalle de un análisis
router.get('/:id', authMiddleware, (req, res) => {
  const analysis = getAnalysisById(parseInt(req.params.id), req.userId!);
  if (!analysis) {
    res.status(404).json({ error: 'Análisis no encontrado' });
    return;
  }
  res.json({ analysis });
});

// DELETE /api/analysis/:id - Eliminar análisis
router.delete('/:id', authMiddleware, (req, res) => {
  const deleted = deleteAnalysis(parseInt(req.params.id), req.userId!);
  if (!deleted) {
    res.status(404).json({ error: 'Análisis no encontrado' });
    return;
  }
  res.status(204).send();
});

export default router;
