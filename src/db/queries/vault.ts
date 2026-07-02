import type { DbMeetingNote, DbDecision, DbRetrospective, DbRunSheet, DbRunSheetItem, DbWikiPage, DbCost } from '@/types/db'
import { getDb } from '../client'

// --- Meeting Notes ---
export async function listMeetingNotes(projectId: string): Promise<DbMeetingNote[]> {
  const db = getDb()
  const r = await db.query<DbMeetingNote>(`SELECT * FROM meeting_notes WHERE project_id = $1 ORDER BY meeting_date DESC`, [projectId])
  return r.rows
}
export async function getMeetingNote(id: string): Promise<DbMeetingNote | null> {
  const db = getDb()
  const r = await db.query<DbMeetingNote>(`SELECT * FROM meeting_notes WHERE id = $1`, [id])
  return r.rows[0] ?? null
}
export async function saveMeetingNote(data: Omit<DbMeetingNote, 'created_at' | 'updated_at'>): Promise<DbMeetingNote> {
  const db = getDb()
  const r = await db.query<DbMeetingNote>(
    `INSERT INTO meeting_notes (id, project_id, title, meeting_date, attendees, body)
     VALUES ($1,$2,$3,$4,$5,$6)
     ON CONFLICT (id) DO UPDATE SET title=$3, meeting_date=$4, attendees=$5, body=$6, updated_at=NOW()
     RETURNING *`,
    [data.id, data.project_id, data.title, data.meeting_date, data.attendees, data.body],
  )
  return r.rows[0]
}
export async function deleteMeetingNote(id: string): Promise<void> {
  const db = getDb()
  await db.query(`DELETE FROM meeting_notes WHERE id = $1`, [id])
}

// --- Decisions ---
export async function listDecisions(projectId: string): Promise<DbDecision[]> {
  const db = getDb()
  const r = await db.query<DbDecision>(`SELECT * FROM decisions WHERE project_id = $1 ORDER BY decided_at DESC`, [projectId])
  return r.rows
}
export async function saveDecision(data: Omit<DbDecision, 'created_at'>): Promise<DbDecision> {
  const db = getDb()
  const r = await db.query<DbDecision>(
    `INSERT INTO decisions (id, project_id, title, decision, rationale, owner_id, decided_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7)
     ON CONFLICT (id) DO UPDATE SET title=$3, decision=$4, rationale=$5, owner_id=$6, decided_at=$7
     RETURNING *`,
    [data.id, data.project_id, data.title, data.decision, data.rationale, data.owner_id, data.decided_at],
  )
  return r.rows[0]
}
export async function deleteDecision(id: string): Promise<void> {
  await getDb().query(`DELETE FROM decisions WHERE id = $1`, [id])
}

// --- Retrospectives ---
export async function listRetros(projectId: string): Promise<DbRetrospective[]> {
  const db = getDb()
  const r = await db.query<DbRetrospective>(`SELECT * FROM retrospectives WHERE project_id = $1 ORDER BY held_at DESC`, [projectId])
  return r.rows
}
export async function saveRetro(data: Omit<DbRetrospective, 'created_at'>): Promise<DbRetrospective> {
  const db = getDb()
  const r = await db.query<DbRetrospective>(
    `INSERT INTO retrospectives (id, project_id, sprint_id, went_well, to_improve, actions, held_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7)
     ON CONFLICT (id) DO UPDATE SET sprint_id=$3, went_well=$4, to_improve=$5, actions=$6, held_at=$7
     RETURNING *`,
    [data.id, data.project_id, data.sprint_id, data.went_well, data.to_improve, data.actions, data.held_at],
  )
  return r.rows[0]
}
export async function deleteRetro(id: string): Promise<void> {
  await getDb().query(`DELETE FROM retrospectives WHERE id = $1`, [id])
}

// --- Run Sheets ---
export async function listRunSheets(projectId: string): Promise<DbRunSheet[]> {
  const db = getDb()
  const r = await db.query<DbRunSheet>(`SELECT * FROM run_sheets WHERE project_id = $1 ORDER BY created_at DESC`, [projectId])
  return r.rows
}
export async function saveRunSheet(data: Omit<DbRunSheet, 'created_at'>): Promise<DbRunSheet> {
  const db = getDb()
  const r = await db.query<DbRunSheet>(
    `INSERT INTO run_sheets (id, project_id, title, description) VALUES ($1,$2,$3,$4)
     ON CONFLICT (id) DO UPDATE SET title=$3, description=$4 RETURNING *`,
    [data.id, data.project_id, data.title, data.description],
  )
  return r.rows[0]
}
export async function deleteRunSheet(id: string): Promise<void> {
  await getDb().query(`DELETE FROM run_sheets WHERE id = $1`, [id])
}
export async function getRunSheetItems(runSheetId: string): Promise<DbRunSheetItem[]> {
  const db = getDb()
  const r = await db.query<DbRunSheetItem>(`SELECT * FROM run_sheet_items WHERE run_sheet_id = $1 ORDER BY position`, [runSheetId])
  return r.rows
}
export async function saveRunSheetItem(data: DbRunSheetItem): Promise<void> {
  const db = getDb()
  await db.query(
    `INSERT INTO run_sheet_items (id, run_sheet_id, label, notes, checked, position)
     VALUES ($1,$2,$3,$4,$5,$6)
     ON CONFLICT (id) DO UPDATE SET label=$3, notes=$4, checked=$5, position=$6`,
    [data.id, data.run_sheet_id, data.label, data.notes, data.checked, data.position],
  )
}
export async function deleteRunSheetItem(id: string): Promise<void> {
  await getDb().query(`DELETE FROM run_sheet_items WHERE id = $1`, [id])
}

// --- Wiki Pages ---
export async function listWikiPages(projectId: string): Promise<DbWikiPage[]> {
  const db = getDb()
  const r = await db.query<DbWikiPage>(
    `SELECT * FROM wiki_pages WHERE project_id = $1 ORDER BY parent_id NULLS FIRST, position`,
    [projectId],
  )
  return r.rows
}
export async function getWikiPage(id: string): Promise<DbWikiPage | null> {
  const db = getDb()
  const r = await db.query<DbWikiPage>(`SELECT * FROM wiki_pages WHERE id = $1`, [id])
  return r.rows[0] ?? null
}
export async function saveWikiPage(data: Omit<DbWikiPage, 'created_at' | 'updated_at'>): Promise<DbWikiPage> {
  const db = getDb()
  const r = await db.query<DbWikiPage>(
    `INSERT INTO wiki_pages (id, project_id, parent_id, title, body, position)
     VALUES ($1,$2,$3,$4,$5,$6)
     ON CONFLICT (id) DO UPDATE SET parent_id=$3, title=$4, body=$5, position=$6, updated_at=NOW()
     RETURNING *`,
    [data.id, data.project_id, data.parent_id, data.title, data.body, data.position],
  )
  return r.rows[0]
}
export async function deleteWikiPage(id: string): Promise<void> {
  await getDb().query(`DELETE FROM wiki_pages WHERE id = $1`, [id])
}

// --- Costs ---
export async function listCosts(projectId: string): Promise<DbCost[]> {
  const db = getDb()
  const r = await db.query<DbCost>(`SELECT * FROM costs WHERE project_id = $1 ORDER BY name`, [projectId])
  return r.rows
}
export async function saveCost(data: Omit<DbCost, 'created_at'>): Promise<DbCost> {
  const db = getDb()
  const r = await db.query<DbCost>(
    `INSERT INTO costs (id, project_id, name, category, cadence, amount, currency, budget, active, notes, start_date)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
     ON CONFLICT (id) DO UPDATE SET name=$3, category=$4, cadence=$5, amount=$6, currency=$7, budget=$8, active=$9, notes=$10, start_date=$11
     RETURNING *`,
    [data.id, data.project_id, data.name, data.category, data.cadence, data.amount, data.currency, data.budget, data.active, data.notes, data.start_date],
  )
  return r.rows[0]
}
export async function deleteCost(id: string): Promise<void> {
  await getDb().query(`DELETE FROM costs WHERE id = $1`, [id])
}
