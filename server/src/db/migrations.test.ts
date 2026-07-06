import { describe, it, expect } from 'vitest';
import Database from 'better-sqlite3';
import { runVersionedMigrations, MIGRATIONS } from './migrations.js';

function dbBase() {
  const db = new Database(':memory:');
  // Esquema base mínimo que las migraciones asumen existente
  db.exec(`
    CREATE TABLE users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      name TEXT,
      is_admin INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);
  return db;
}

describe('migraciones versionadas', () => {
  it('aplica todas las migraciones y fija user_version', () => {
    const db = dbBase();
    runVersionedMigrations(db);
    const version = (db.pragma('user_version', { simple: true }) as number);
    expect(version).toBe(MIGRATIONS[MIGRATIONS.length - 1].version);

    // v1: columna plan con default free + tabla de perfiles
    db.prepare(`INSERT INTO users (email, password_hash) VALUES ('a@a.es', 'x')`).run();
    const user = db.prepare('SELECT plan FROM users WHERE email = ?').get('a@a.es') as { plan: string };
    expect(user.plan).toBe('free');
    expect(() => db.prepare('SELECT * FROM company_profiles').all()).not.toThrow();
  });

  it('es idempotente: ejecutarlas dos veces no rompe ni duplica', () => {
    const db = dbBase();
    runVersionedMigrations(db);
    expect(() => runVersionedMigrations(db)).not.toThrow();
  });
});
