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
} from '../services/analysis.service.js';

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
  try {
    // Debug RAW: qué llega exactamente del frontend ANTES de parsear
    console.log('[Analysis] ====== RAW REQUEST ======');
    console.log(`[Analysis] Content-Type: ${req.headers['content-type']}`);
    console.log(`[Analysis] Body keys: ${Object.keys(req.body || {}).join(', ')}`);
    console.log(`[Analysis] body.inputType: "${req.body?.inputType}" (type: ${typeof req.body?.inputType})`);
    console.log(`[Analysis] body.text: ${req.body?.text ? `"${String(req.body.text).slice(0, 200)}..." (${String(req.body.text).length} chars)` : `${JSON.stringify(req.body?.text)} (type: ${typeof req.body?.text})`}`);
    console.log(`[Analysis] body.url: ${JSON.stringify(req.body?.url)}`);
    console.log(`[Analysis] body.file: ${req.body?.file ? `{name: "${req.body.file.name}", data: ${req.body.file.data?.length || 0} chars}` : JSON.stringify(req.body?.file)}`);
    console.log('[Analysis] ==============================');

    const body = analysisSchema.parse(req.body);
    const userId = req.userId!;

    // Debug: qué queda DESPUÉS de zod
    console.log('[Analysis] ====== AFTER ZOD PARSE ======');
    console.log(`[Analysis] inputType: ${body.inputType}`);
    console.log(`[Analysis] text: ${body.text ? `${body.text.length} chars` : 'VACÍO/undefined'}`);
    console.log(`[Analysis] url: ${body.url || 'VACÍO/undefined'}`);
    console.log(`[Analysis] file: ${body.file ? body.file.name : 'VACÍO/undefined'}`);
    console.log('[Analysis] ================================');

    // Validar que hay contenido real para analizar
    const hasText = body.text && body.text.trim().length > 0;
    const hasUrl = body.url && body.url.trim().length > 0;
    const hasFile = !!body.file;
    if (!hasText && !hasFile) {
      console.warn('[Analysis] RECHAZADO: no hay texto ni archivo para analizar');
      res.status(400).json({
        error: hasUrl
          ? 'Debes pegar el texto del pliego además de la URL. El modelo local no puede acceder a enlaces de internet.'
          : 'No se ha proporcionado contenido para analizar. Pega el texto del pliego en el editor.'
      });
      return;
    }

    // Crear registro en DB
    const analysisId = createAnalysisRecord({
      userId,
      inputType: body.inputType,
      text: body.text,
      url: body.url,
      fileName: body.file?.name,
    });

    // Configurar SSE
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    // Enviar ID del análisis
    res.write(`data: ${JSON.stringify({ type: 'id', analysisId })}\n\n`);

    const messages = buildMessages({
      userId,
      inputType: body.inputType,
      text: body.text,
      url: body.url,
      fileName: body.file?.name,
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
