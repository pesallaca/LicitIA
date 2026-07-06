import type { Request, Response, NextFunction } from 'express';
import { config } from '../config.js';

export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction): void {
  // El detalle completo SOLO al log del servidor
  console.error('[Error]', err.stack || err.message);
  // Al cliente, en producción, nunca se filtran detalles internos
  const message = config.NODE_ENV === 'production'
    ? 'Error interno del servidor'
    : err.message || 'Error interno del servidor';
  res.status(500).json({ error: message });
}
