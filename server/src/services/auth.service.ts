import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { config } from '../config.js';
import { getDb } from '../db/connection.js';

interface UserRow {
  id: number;
  email: string;
  password_hash: string;
  name: string | null;
  created_at: string;
}

export interface SafeUser {
  id: number;
  email: string;
  name: string | null;
  created_at: string;
}

function toSafeUser(row: UserRow): SafeUser {
  return { id: row.id, email: row.email, name: row.name, created_at: row.created_at };
}

export async function registerUser(email: string, password: string, name?: string): Promise<{ user: SafeUser; token: string }> {
  const db = getDb();

  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (existing) throw new Error('El email ya está registrado');

  const passwordHash = await bcrypt.hash(password, 10);
  const result = db.prepare('INSERT INTO users (email, password_hash, name) VALUES (?, ?, ?)').run(email, passwordHash, name || null);

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(result.lastInsertRowid) as UserRow;
  const token = generateToken(user.id, user.email);

  return { user: toSafeUser(user), token };
}

export async function loginUser(email: string, password: string): Promise<{ user: SafeUser; token: string }> {
  const db = getDb();

  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email) as UserRow | undefined;
  if (!user) throw new Error('Credenciales incorrectas');

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) throw new Error('Credenciales incorrectas');

  const token = generateToken(user.id, user.email);
  return { user: toSafeUser(user), token };
}

export function getUserById(userId: number): SafeUser | null {
  const db = getDb();
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId) as UserRow | undefined;
  return user ? toSafeUser(user) : null;
}

function generateToken(userId: number, email: string): string {
  return jwt.sign({ userId, email }, config.JWT_SECRET, { expiresIn: config.JWT_EXPIRES_IN });
}

export function verifyToken(token: string): { userId: number; email: string } {
  return jwt.verify(token, config.JWT_SECRET) as { userId: number; email: string };
}
