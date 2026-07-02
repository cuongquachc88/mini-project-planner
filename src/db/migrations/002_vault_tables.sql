CREATE TABLE IF NOT EXISTS meeting_notes (
  id TEXT PRIMARY KEY,
  project_id TEXT REFERENCES projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  meeting_date DATE NOT NULL,
  attendees TEXT,
  body TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS decisions (
  id TEXT PRIMARY KEY,
  project_id TEXT REFERENCES projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  decision TEXT NOT NULL,
  rationale TEXT,
  owner_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  decided_at DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS retrospectives (
  id TEXT PRIMARY KEY,
  project_id TEXT REFERENCES projects(id) ON DELETE CASCADE,
  sprint_id TEXT REFERENCES sprints(id) ON DELETE SET NULL,
  went_well TEXT,
  to_improve TEXT,
  actions TEXT,
  held_at DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS run_sheets (
  id TEXT PRIMARY KEY,
  project_id TEXT REFERENCES projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS run_sheet_items (
  id TEXT PRIMARY KEY,
  run_sheet_id TEXT REFERENCES run_sheets(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  notes TEXT,
  checked BOOLEAN DEFAULT FALSE,
  position INTEGER NOT NULL DEFAULT 0
);

UPDATE app_meta SET value = '2' WHERE key = 'schema_version';
