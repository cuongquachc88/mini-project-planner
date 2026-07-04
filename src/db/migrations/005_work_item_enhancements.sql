ALTER TABLE work_items ADD COLUMN IF NOT EXISTS acceptance_criteria TEXT;
ALTER TABLE work_items ADD COLUMN IF NOT EXISTS tech_notes TEXT;
ALTER TABLE work_items ADD COLUMN IF NOT EXISTS wiki_page_id TEXT REFERENCES wiki_pages(id) ON DELETE SET NULL;

CREATE TABLE IF NOT EXISTS work_item_attachments (
  id TEXT PRIMARY KEY,
  work_item_id TEXT REFERENCES work_items(id) ON DELETE CASCADE,
  filename TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  size_bytes INTEGER NOT NULL,
  data TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_attachments_work_item ON work_item_attachments(work_item_id);

UPDATE app_meta SET value = '5' WHERE key = 'schema_version';
