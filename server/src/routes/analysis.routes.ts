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
    const body = analysisSchema.parse(req.body);
    const userId = req.userId!;

    // Debug: qué llega del frontend
    console.log('[Analysis] ====== REQUEST DEBUG ======');
    console.log(`[Analysis] inputType: ${body.inputType}`);
    console.log(`[Analysis] text: ${body.text ? `${body.text.length} chars` : 'VACÍO/undefined'}`);
    console.log(`[Analysis] url: ${body.url || 'VACÍO/undefined'}`);
    console.log(`[Analysis] file: ${body.file ? body.file.name : 'VACÍO/undefined'}`);
    console.log('[Analysis] ==========================');

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
        updateAnalysisResult(analysisId, response.content, response);
        res.write(`data: [DONE]\n\n`);
        res.end();
      },
      onError: (error) => {
        console.error('[Analysis] Error LLM:', error.message);
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
