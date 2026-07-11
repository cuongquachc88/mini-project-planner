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

// Tables in dependency order (parents before children for export, children first for delete)
const SYNC_TABLES = [
  'users', 'projects', 'project_members', 'custom_stages', 'labels',
  'epics', 'milestones', 'sprints', 'work_items', 'work_item_labels',
  'comments', 'meeting_notes', 'decisions', 'retrospectives',
  'run_sheets', 'run_sheet_items', 'wiki_pages', 'costs',
] as const

export type DbSnapshot = Record<string, Record<string, unknown>[]>

export async function exportDbAsJson(): Promise<DbSnapshot> {
  const db = getDb()
  const snapshot: DbSnapshot = {}
  for (const table of SYNC_TABLES) {
    const result = await db.query(`SELECT * FROM ${table}`)
    snapshot[table] = result.rows as Record<string, unknown>[]
  }
  return snapshot
}

const IDENTIFIER_RE = /^[a-zA-Z_][a-zA-Z0-9_]*$/

function safeId(name: string): string {
  if (!IDENTIFIER_RE.test(name)) throw new Error(`Unsafe SQL identifier: ${name}`)
  return `"${name}"`
}

export async function mergeAndApplySnapshot(remote: DbSnapshot): Promise<void> {
  const db = getDb()
  const local = await exportDbAsJson()

  for (const table of SYNC_TABLES) {
    const localRows = local[table] ?? []
    const remoteRows = (remote[table] ?? []).filter(
      r => r && typeof r === 'object' && typeof r.id === 'string'
    )

    // Build merged map: local rows first, then overwrite with newer remote rows
    const merged = new Map<string, Record<string, unknown>>()
    for (const row of localRows) merged.set(row.id as string, row)

    for (const row of remoteRows) {
      const id = row.id as string
      const existing = merged.get(id)
      if (!existing) {
        merged.set(id, row)
      } else {
        const localTs = existing.updated_at ? new Date(existing.updated_at as string).getTime() : 0
        const remoteTs = row.updated_at ? new Date(row.updated_at as string).getTime() : 0
        if (remoteTs > localTs) merged.set(id, row)
      }
    }

    const mergedRows = Array.from(merged.values())
    if (mergedRows.length === 0) continue

    // Use column names from the local export (trusted schema), not from remote payload
    const cols = Object.keys(local[table]?.[0] ?? mergedRows[0]).filter(c =>
      IDENTIFIER_RE.test(c)
    )
    if (cols.length === 0) continue

    const colList = cols.map(safeId).join(', ')
    const updateSet = cols
      .filter(c => c !== 'id')
      .map(c => `${safeId(c)} = EXCLUDED.${safeId(c)}`)
      .join(', ')

    for (const row of mergedRows) {
      const values = cols.map(c => {
        const v = row[c]
        if (v === null || v === undefined) return 'NULL'
        if (typeof v === 'boolean') return v ? 'TRUE' : 'FALSE'
        if (typeof v === 'number') return String(v)
        return `'${String(v).replace(/'/g, "''")}'`
      })
      await db.exec(
        `INSERT INTO ${safeId(table)} (${colList}) VALUES (${values.join(', ')}) ON CONFLICT (id) DO UPDATE SET ${updateSet}`
      )
    }
  }
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
