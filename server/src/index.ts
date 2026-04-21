import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from './config.js';
import { runMigrations } from './db/migrate.js';
import { errorHandler } from './middleware/errorHandler.js';
import authRoutes from './routes/auth.routes.js';
import analysisRoutes from './routes/analysis.routes.js';
import pdfRoutes from './routes/pdf.routes.js';
import shareRoutes from './routes/share.routes.js';
import marketRoutes from './routes/market.routes.js';
import { startScraperSchedule } from './services/scraper.service.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
app.set('trust proxy', 1); // Nginx delante: usar IP real del header X-Forwarded-For

// Middleware global
app.use(cors({
  origin: config.NODE_ENV === 'development' ? 'http://localhost:3000' : true,
  credentials: true,
}));
app.use(express.json({ limit: '50mb' }));
app.use(cookieParser());

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', version: '1.0.0' });
});

// Rutas
app.use('/api/auth', authRoutes);
app.use('/api/analysis', analysisRoutes);
app.use('/api/pdf', pdfRoutes);
app.use('/api/share', shareRoutes);
app.use('/api/market', marketRoutes);

// Servir frontend en producción
if (config.NODE_ENV === 'production') {
  const clientDist = path.resolve(__dirname, '../../client/dist');
  app.use(express.static(clientDist));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}

// Error handler
app.use(errorHandler);

// Iniciar
runMigrations();

// Iniciar scraper de PLACSP
startScraperSchedule();

app.listen(config.PORT, '127.0.0.1', () => {
  console.log(`[Server] LicitIA corriendo en http://localhost:${config.PORT}`);
  console.log(`[Server] Entorno: ${config.NODE_ENV}`);
  console.log(`[Server] LLM: ${config.LLM_PROVIDER} (${config.LLM_PROVIDER === 'ollama' ? config.OLLAMA_MODEL : config.OPENAI_MODEL})`);
});
