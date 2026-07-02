CREATE TABLE IF NOT EXISTS wiki_pages (
  id TEXT PRIMARY KEY,
  project_id TEXT REFERENCES projects(id) ON DELETE CASCADE,
  parent_id TEXT REFERENCES wiki_pages(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  body TEXT,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS costs (
  id TEXT PRIMARY KEY,
  project_id TEXT REFERENCES projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT,
  cadence TEXT,
  amount NUMERIC(10,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  budget NUMERIC(10,2),
  active BOOLEAN DEFAULT TRUE,
  notes TEXT,
  start_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_wiki_pages_project_parent ON wiki_pages (project_id, parent_id);

UPDATE app_meta SET value = '3' WHERE key = 'schema_version';
