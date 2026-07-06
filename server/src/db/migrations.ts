import type BetterSqlite3 from 'better-sqlite3';

/**
 * Migraciones VERSIONADAS (PRAGMA user_version).
 * schema.sql define la base (CREATE TABLE IF NOT EXISTS); a partir de ahí,
 * cada cambio de esquema es una migración numerada que se aplica UNA vez.
 * Así el esquema puede evolucionar en producción sin perder datos.
 */
export const MIGRATIONS: { version: number; name: string; up: (db: BetterSqlite3.Database) => void }[] = [
  {
    version: 1,
    name: 'planes de usuario + perfil de empresa',
    up: (db) => {
      // Plan de suscripción (base de la monetización): free | pro
      const cols = db.prepare(`PRAGMA table_info(users)`).all() as { name: string }[];
      if (!cols.some((c) => c.name === 'plan')) {
        db.exec(`ALTER TABLE users ADD COLUMN plan TEXT NOT NULL DEFAULT 'free'`);
      }
      // Perfil de empresa: alimenta el matching de licitaciones relevantes
      db.exec(`
        CREATE TABLE IF NOT EXISTS company_profiles (
          user_id     INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
          cpv_prefixes TEXT NOT NULL DEFAULT '',
          keywords     TEXT NOT NULL DEFAULT '',
          min_budget   REAL,
          max_budget   REAL,
          updated_at   TEXT NOT NULL DEFAULT (datetime('now'))
        )
      `);
    },
  },
];

export function runVersionedMigrations(db: BetterSqlite3.Database): void {
  const current = db.pragma('user_version', { simple: true }) as number;
  for (const m of MIGRATIONS.filter((m) => m.version > current).sort((a, b) => a.version - b.version)) {
    const apply = db.transaction(() => {
      m.up(db);
      db.pragma(`user_version = ${m.version}`);
    });
    apply();
    console.log(`[DB] Migración v${m.version} aplicada: ${m.name}`);
  }
}
