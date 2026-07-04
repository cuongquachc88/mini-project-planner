ALTER TABLE projects ADD COLUMN IF NOT EXISTS icon TEXT;

INSERT INTO app_meta (key, value) VALUES ('schema_version', '4') ON CONFLICT (key) DO UPDATE SET value = '4';
