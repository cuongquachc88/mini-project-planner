import type { PGlite } from '@electric-sql/pglite'
import type { PGliteWithLive } from '@electric-sql/pglite/live'

const migrations = [
  { version: 1, file: '001_initial_schema.sql' },
  { version: 2, file: '002_vault_tables.sql' },
  { version: 3, file: '003_costs_wiki.sql' },
  { version: 4, file: '004_project_icon.sql' },
]

// Vite transforms ?raw imports at build time; this pattern is resolved statically
const SQL_FILES = import.meta.glob<string>('./*.sql', { query: '?raw', import: 'default', eager: true })

function loadSql(file: string): string {
  const key = `./${file}`
  const sql = SQL_FILES[key]
  if (!sql) throw new Error(`Migration file not found: ${file}`)
  return sql
}

export async function runMigrations(db: PGlite | PGliteWithLive): Promise<void> {
  await db.exec(`CREATE TABLE IF NOT EXISTS app_meta (key TEXT PRIMARY KEY, value TEXT NOT NULL)`)
  await db.exec(`INSERT INTO app_meta (key, value) VALUES ('schema_version', '0') ON CONFLICT (key) DO NOTHING`)

  const result = await db.query<{ value: string }>(`SELECT value FROM app_meta WHERE key = 'schema_version'`)
  const currentVersion = parseInt(result.rows[0]?.value ?? '0', 10)

  for (const migration of migrations) {
    if (migration.version > currentVersion) {
      const sql = loadSql(migration.file)
      await db.exec(sql)
      await db.exec(`UPDATE app_meta SET value = '${migration.version}' WHERE key = 'schema_version'`)
      console.log(`[DB] Applied migration v${migration.version}`)
    }
  }
}
