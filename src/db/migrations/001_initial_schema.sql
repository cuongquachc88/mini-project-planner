CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  avatar_url TEXT,
  role TEXT NOT NULL DEFAULT 'teammate',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS projects (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  key TEXT UNIQUE NOT NULL,
  owner_id TEXT REFERENCES users(id),
  color TEXT,
  archived BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS project_members (
  project_id TEXT REFERENCES projects(id) ON DELETE CASCADE,
  user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'teammate',
  PRIMARY KEY (project_id, user_id)
);

CREATE TABLE IF NOT EXISTS custom_stages (
  id TEXT PRIMARY KEY,
  project_id TEXT REFERENCES projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT,
  position INTEGER NOT NULL DEFAULT 0,
  is_done BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS labels (
  id TEXT PRIMARY KEY,
  project_id TEXT REFERENCES projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#6366f1'
);

CREATE TABLE IF NOT EXISTS epics (
  id TEXT PRIMARY KEY,
  project_id TEXT REFERENCES projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  color TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  start_date DATE,
  target_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS milestones (
  id TEXT PRIMARY KEY,
  project_id TEXT REFERENCES projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  target_date DATE,
  status TEXT NOT NULL DEFAULT 'upcoming',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sprints (
  id TEXT PRIMARY KEY,
  project_id TEXT REFERENCES projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  goal TEXT,
  status TEXT NOT NULL DEFAULT 'planning',
  start_date DATE,
  end_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS work_items (
  id TEXT PRIMARY KEY,
  project_id TEXT REFERENCES projects(id) ON DELETE CASCADE,
  sprint_id TEXT REFERENCES sprints(id) ON DELETE SET NULL,
  epic_id TEXT REFERENCES epics(id) ON DELETE SET NULL,
  milestone_id TEXT REFERENCES milestones(id) ON DELETE SET NULL,
  stage_id TEXT REFERENCES custom_stages(id) ON DELETE SET NULL,
  parent_id TEXT REFERENCES work_items(id) ON DELETE SET NULL,
  type TEXT NOT NULL DEFAULT 'task',
  title TEXT NOT NULL,
  description TEXT,
  priority TEXT NOT NULL DEFAULT 'medium',
  story_points INTEGER,
  assignee_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  reporter_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  due_date DATE,
  position INTEGER NOT NULL DEFAULT 0,
  backlog_pos INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS work_item_labels (
  work_item_id TEXT REFERENCES work_items(id) ON DELETE CASCADE,
  label_id TEXT REFERENCES labels(id) ON DELETE CASCADE,
  PRIMARY KEY (work_item_id, label_id)
);

CREATE TABLE IF NOT EXISTS comments (
  id TEXT PRIMARY KEY,
  work_item_id TEXT REFERENCES work_items(id) ON DELETE CASCADE,
  author_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS app_meta (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_work_items_project_sprint ON work_items (project_id, sprint_id);
CREATE INDEX IF NOT EXISTS idx_work_items_project_stage ON work_items (project_id, stage_id);
CREATE INDEX IF NOT EXISTS idx_work_items_project_epic ON work_items (project_id, epic_id);
CREATE INDEX IF NOT EXISTS idx_sprints_project_status ON sprints (project_id, status);

INSERT INTO app_meta (key, value) VALUES ('schema_version', '1') ON CONFLICT (key) DO NOTHING;
