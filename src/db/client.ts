import { PGlite } from '@electric-sql/pglite'
import { live, type PGliteWithLive } from '@electric-sql/pglite/live'
import { runMigrations } from './migrations'

let _db: PGliteWithLive | null = null

export async function initDb(): Promise<PGliteWithLive> {
  if (_db) return _db

  const db = await PGlite.create('idb://planner-db', {
    extensions: { live },
  })

  _db = db as unknown as PGliteWithLive

  await runMigrations(_db)
  return _db
}

export function getDb(): PGliteWithLive {
  if (!_db) throw new Error('DB not initialized — call initDb() first')
  return _db
}

export async function exportDbAsSql(): Promise<string> {
  const db = getDb()
  const tables = [
    'users', 'projects', 'project_members', 'custom_stages', 'labels',
    'epics', 'milestones', 'sprints', 'work_items', 'work_item_labels',
    'comments', 'meeting_notes', 'decisions', 'retrospectives',
    'run_sheets', 'run_sheet_items', 'wiki_pages', 'costs', 'app_meta',
  ]

  const lines: string[] = [
    '-- Mini Project Planner backup',
    `-- Generated: ${new Date().toISOString()}`,
    '',
  ]

  for (const table of tables) {
    const rows = await db.query(`SELECT * FROM ${table}`)
    if (rows.rows.length === 0) continue

    const cols = rows.fields.map((f) => f.name)
    lines.push(`-- Table: ${table}`)

    for (const row of rows.rows as Record<string, unknown>[]) {
      const values = cols.map((c) => {
        const v = row[c]
        if (v === null || v === undefined) return 'NULL'
        if (typeof v === 'boolean') return v ? 'TRUE' : 'FALSE'
        if (typeof v === 'number') return String(v)
        return `'${String(v).replace(/'/g, "''")}'`
      })
      lines.push(`INSERT INTO ${table} (${cols.join(', ')}) VALUES (${values.join(', ')}) ON CONFLICT DO NOTHING;`)
    }
    lines.push('')
  }

  return lines.join('\n')
}

export async function restoreFromSql(sql: string): Promise<void> {
  const db = getDb()
  const tables = [
    'work_item_labels', 'comments', 'work_items', 'run_sheet_items', 'run_sheets',
    'meeting_notes', 'decisions', 'retrospectives', 'wiki_pages', 'costs',
    'sprints', 'epics', 'milestones', 'custom_stages', 'labels',
    'project_members', 'projects', 'users', 'app_meta',
  ]
  for (const table of tables) {
    await db.exec(`DELETE FROM ${table}`)
  }
  await db.exec(sql)
}
