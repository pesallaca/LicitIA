CREATE TABLE IF NOT EXISTS users (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  email         TEXT    NOT NULL UNIQUE,
  password_hash TEXT    NOT NULL,
  name          TEXT,
  is_admin      INTEGER NOT NULL DEFAULT 0,
  created_at    TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS analyses (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id         INTEGER NOT NULL REFERENCES users(id),
  title           TEXT,
  input_type      TEXT    NOT NULL CHECK(input_type IN ('text','url','file')),
  input_content   TEXT,
  file_name       TEXT,
  result_markdown TEXT,
  llm_provider    TEXT    NOT NULL DEFAULT 'ollama',
  llm_model       TEXT    NOT NULL DEFAULT 'llama3.1:8b',
  tokens_used     INTEGER,
  duration_ms     INTEGER,
  created_at      TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS shared_reports (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  analysis_id INTEGER NOT NULL REFERENCES analyses(id) ON DELETE CASCADE,
  token       TEXT    NOT NULL UNIQUE,
  expires_at  TEXT,
  created_at  TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS market_tenders (
  id                  INTEGER PRIMARY KEY AUTOINCREMENT,
  external_id         TEXT    UNIQUE,
  title               TEXT    NOT NULL,
  contracting_body    TEXT,
  contract_type       TEXT,
  procedure_type      TEXT,
  budget_amount       REAL,
  currency            TEXT    DEFAULT 'EUR',
  submission_deadline TEXT,
  status              TEXT,
  cpv_code            TEXT,
  source_url          TEXT,
  scraped_at          TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_analyses_user   ON analyses(user_id);
CREATE INDEX IF NOT EXISTS idx_shared_token    ON shared_reports(token);
CREATE INDEX IF NOT EXISTS idx_market_deadline ON market_tenders(submission_deadline);
CREATE INDEX IF NOT EXISTS idx_market_cpv      ON market_tenders(cpv_code);
