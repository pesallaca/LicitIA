import { Router } from 'express';
import { z } from 'zod';
import { registerUser, loginUser, getUserById } from '../services/auth.service.js';
import { authMiddleware } from '../middleware/auth.js';
import { config } from '../config.js';

const router = Router();

const registerSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
  name: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: config.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 días
};

router.post('/register', async (_req, res) => {
  res.status(403).json({ error: 'El registro público está deshabilitado. El acceso solo está disponible para usuarios autorizados.' });
});

router.post('/login', async (req, res) => {
  try {
    const body = loginSchema.parse(req.body);
    const { user, token } = await loginUser(body.email, body.password);
    res.cookie('licitia_token', token, COOKIE_OPTIONS);
    res.json({ user });
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: err.errors[0].message });
      return;
    }
    res.status(401).json({ error: err.message });
  }
});

router.get('/me', authMiddleware, (req, res) => {
  const user = getUserById(req.userId!);
  if (!user) {
    res.status(404).json({ error: 'Usuario no encontrado' });
    return;
  }
  res.json({ user });
});

router.post('/logout', (_req, res) => {
  res.cookie('licitia_token', '', { ...COOKIE_OPTIONS, maxAge: 0 });
  res.json({ message: 'Sesión cerrada' });
});

export default router;
