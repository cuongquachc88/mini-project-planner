import type { DbSprint } from '@/types/db'
import type { SprintWithStats } from '@/types/domain'
import { getDb } from '../client'

export async function listSprints(projectId: string): Promise<DbSprint[]> {
  const db = getDb()
  const r = await db.query<DbSprint>(
    `SELECT * FROM sprints WHERE project_id = $1 ORDER BY created_at DESC`,
    [projectId],
  )
  return r.rows
}

export async function getActiveSprint(projectId: string): Promise<DbSprint | null> {
  const db = getDb()
  const r = await db.query<DbSprint>(
    `SELECT * FROM sprints WHERE project_id = $1 AND status = 'active' LIMIT 1`,
    [projectId],
  )
  return r.rows[0] ?? null
}

export async function createSprint(data: { projectId: string; name: string; goal?: string; startDate?: string; endDate?: string }): Promise<DbSprint> {
  const db = getDb()
  const id = crypto.randomUUID()
  const r = await db.query<DbSprint>(
    `INSERT INTO sprints (id, project_id, name, goal, start_date, end_date)
     VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
    [id, data.projectId, data.name, data.goal ?? null, data.startDate ?? null, data.endDate ?? null],
  )
  return r.rows[0]
}

export async function startSprint(id: string): Promise<void> {
  const db = getDb()
  await db.query(`UPDATE sprints SET status = 'active', start_date = COALESCE(start_date, CURRENT_DATE) WHERE id = $1`, [id])
}

export async function completeSprint(id: string, moveIncompleteToSprintId?: string | null): Promise<void> {
  const db = getDb()
  await db.query(`UPDATE sprints SET status = 'completed', end_date = COALESCE(end_date, CURRENT_DATE) WHERE id = $1`, [id])

  if (moveIncompleteToSprintId) {
    await db.query(
      `UPDATE work_items SET sprint_id = $1 WHERE sprint_id = $2 AND stage_id NOT IN (
        SELECT id FROM custom_stages WHERE is_done = TRUE AND project_id = (SELECT project_id FROM sprints WHERE id = $2)
      )`,
      [moveIncompleteToSprintId, id],
    )
  } else {
    // Move incomplete items to backlog
    await db.query(
      `UPDATE work_items SET sprint_id = NULL WHERE sprint_id = $1 AND stage_id NOT IN (
        SELECT id FROM custom_stages WHERE is_done = TRUE AND project_id = (SELECT project_id FROM sprints WHERE id = $1)
      )`,
      [id],
    )
  }
}

export async function getSprintHistory(projectId: string): Promise<SprintWithStats[]> {
  const db = getDb()
  const r = await db.query<SprintWithStats>(
    `SELECT s.*,
      COALESCE(SUM(wi.story_points), 0)::int as "plannedPoints",
      COALESCE(SUM(wi.story_points) FILTER (WHERE cs.is_done = TRUE), 0)::int as "completedPoints",
      COUNT(wi.id)::int as "totalItems",
      COUNT(wi.id) FILTER (WHERE cs.is_done = TRUE)::int as "doneItems"
     FROM sprints s
     LEFT JOIN work_items wi ON wi.sprint_id = s.id
     LEFT JOIN custom_stages cs ON cs.id = wi.stage_id
     WHERE s.project_id = $1 AND s.status = 'completed'
     GROUP BY s.id
     ORDER BY s.end_date DESC`,
    [projectId],
  )
  return r.rows
}
