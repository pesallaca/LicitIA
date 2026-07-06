import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { getDb } from './connection.js';
import { runVersionedMigrations } from './migrations.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export function runMigrations(): void {
  const db = getDb();
  // Try src/ first (dev with tsx), then fall back to relative (production compiled)
  let schemaPath = path.resolve(__dirname, '../../src/db/schema.sql');
  if (!fs.existsSync(schemaPath)) {
    schemaPath = path.resolve(__dirname, '../src/db/schema.sql');
  }
  const schema = fs.readFileSync(schemaPath, 'utf-8');
  db.exec(schema);
  // Migraciones versionadas por encima del esquema base
  runVersionedMigrations(db);
  console.log('[DB] Migraciones aplicadas correctamente');
}
