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
import { isUserAdmin } from '../services/auth.service.js';

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
  const MAINTENANCE_MODE = true; // cambiar a false cuando se reactive el análisis
  if (MAINTENANCE_MODE) {
    res.status(503).json({ error: 'Servicio en mantenimiento. El análisis está temporalmente desactivado.' });
    return;
  }

  try {
    // Debug RAW: DUMP COMPLETO del body
    console.log('[Analysis] ====== RAW BODY DUMP ======');
    console.log(JSON.stringify(req.body, (key, val) => {
      // Truncar campos largos para no inundar el log
      if (typeof val === 'string' && val.length > 500) return val.slice(0, 500) + `... [${val.length} chars total]`;
      return val;
    }, 2));
    console.log('[Analysis] ==============================');

    const body = analysisSchema.parse(req.body);
    const userId = req.userId!;

    // Extraer a locales inmutables para que TypeScript pueda narrow correctamente
    const { inputType, text, url, file } = body;

    // Debug: qué queda DESPUÉS de zod
    const textInfo = text === undefined ? 'VACÍO/undefined' : `${text.length} chars`;
    const fileInfo = file === undefined ? 'VACÍO/undefined' : file.name;
    console.log('[Analysis] ====== AFTER ZOD PARSE ======');
    console.log(`[Analysis] inputType: ${inputType}`);
    console.log(`[Analysis] text: ${textInfo}`);
    console.log(`[Analysis] url: ${url ?? 'VACÍO/undefined'}`);
    console.log(`[Analysis] file: ${fileInfo}`);
    console.log('[Analysis] ================================');

    // Validar que hay contenido real para analizar
    const hasText = (text?.trim().length ?? 0) > 0;
    const hasUrl = (url?.trim().length ?? 0) > 0;
    const hasFile = file !== undefined;
    if (!hasText && !hasFile) {
      console.warn('[Analysis] RECHAZADO: no hay texto ni archivo para analizar');
      res.status(400).json({
        error: hasUrl
          ? 'Debes pegar el texto del pliego además de la URL. El modelo local no puede acceder a enlaces de internet.'
          : 'No se ha proporcionado contenido para analizar. Pega el texto del pliego en el editor.'
      });
      return;
    }

    const admin = isUserAdmin(userId);
    if (!admin) {
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
        console.log(`[Analysis] onDone llamado: ${response.content.length} chars, ${response.tokensUsed} tokens, ${response.durationMs}ms`);
        try {
          updateAnalysisResult(analysisId, response.content, response);
          console.log(`[Analysis] DB actualizada para análisis #${analysisId}`);
        } catch (err) {
          console.error(`[Analysis] ERROR al guardar en DB:`, err);
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
    res.status(500).json({ error: err.message });
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
