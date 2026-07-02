import type { DbEpic, DbMilestone } from '@/types/db'
import type { EpicWithProgress, MilestoneWithHealth } from '@/types/domain'
import { getDb } from '../client'

export async function getEpicsWithProgress(projectId: string): Promise<EpicWithProgress[]> {
  const db = getDb()
  const r = await db.query<EpicWithProgress>(
    `SELECT e.*,
      COUNT(wi.id)::int as "totalItems",
      COUNT(wi.id) FILTER (WHERE cs.is_done = TRUE)::int as "doneItems",
      COALESCE(SUM(wi.story_points), 0)::int as "totalPoints",
      COALESCE(SUM(wi.story_points) FILTER (WHERE cs.is_done = TRUE), 0)::int as "donePoints",
      CASE WHEN COUNT(wi.id) = 0 THEN 0
           ELSE ROUND(COUNT(wi.id) FILTER (WHERE cs.is_done = TRUE)::numeric / COUNT(wi.id) * 100)
      END::int as "completionPct"
     FROM epics e
     LEFT JOIN work_items wi ON wi.epic_id = e.id
     LEFT JOIN custom_stages cs ON cs.id = wi.stage_id
     WHERE e.project_id = $1
     GROUP BY e.id
     ORDER BY e.created_at DESC`,
    [projectId],
  )
  return r.rows
}

export async function getEpic(id: string): Promise<DbEpic | null> {
  const db = getDb()
  const r = await db.query<DbEpic>(`SELECT * FROM epics WHERE id = $1`, [id])
  return r.rows[0] ?? null
}

export async function createEpic(data: { projectId: string; title: string; description?: string; color?: string; startDate?: string; targetDate?: string }): Promise<DbEpic> {
  const db = getDb()
  const id = crypto.randomUUID()
  const r = await db.query<DbEpic>(
    `INSERT INTO epics (id, project_id, title, description, color, start_date, target_date)
     VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
    [id, data.projectId, data.title, data.description ?? null, data.color ?? null, data.startDate ?? null, data.targetDate ?? null],
  )
  return r.rows[0]
}

export async function updateEpic(id: string, data: Partial<Pick<DbEpic, 'title' | 'description' | 'color' | 'status' | 'start_date' | 'target_date'>>): Promise<void> {
  const db = getDb()
  const sets: string[] = []
  const vals: unknown[] = []
  let i = 1
  for (const [k, v] of Object.entries(data)) {
    sets.push(`${k} = $${i++}`)
    vals.push(v)
  }
  if (sets.length === 0) return
  vals.push(id)
  await db.query(`UPDATE epics SET ${sets.join(', ')} WHERE id = $${i}`, vals)
}

export async function deleteEpic(id: string): Promise<void> {
  const db = getDb()
  await db.query(`DELETE FROM epics WHERE id = $1`, [id])
}

export async function getMilestonesWithHealth(projectId: string): Promise<MilestoneWithHealth[]> {
  const db = getDb()
  const r = await db.query(
    `SELECT m.*,
      COUNT(wi.id)::int as "linkedItems",
      COUNT(wi.id) FILTER (WHERE cs.is_done = TRUE)::int as "doneItems"
     FROM milestones m
     LEFT JOIN work_items wi ON wi.milestone_id = m.id
     LEFT JOIN custom_stages cs ON cs.id = wi.stage_id
     WHERE m.project_id = $1
     GROUP BY m.id
     ORDER BY m.target_date NULLS LAST`,
    [projectId],
  )
  return (r.rows as unknown as Record<string, unknown>[]).map((row) => {
    const linked = (row['linkedItems'] as number) ?? 0
    const done = (row['doneItems'] as number) ?? 0
    const pct = linked === 0 ? 0 : done / linked
    const today = new Date()
    const target = row['target_date'] ? new Date(row['target_date'] as string) : null
    const daysLeft = target ? Math.ceil((target.getTime() - today.getTime()) / 86400000) : null
    let health: 'green' | 'amber' | 'red' = 'green'
    if (pct < 0.5 && daysLeft !== null && daysLeft < 7) health = 'red'
    else if (pct < 0.8 && daysLeft !== null && daysLeft < 14) health = 'amber'
    return { ...(row as unknown as DbMilestone), linkedItems: linked, doneItems: done, health }
  })
}

export async function createMilestone(data: { projectId: string; title: string; description?: string; targetDate?: string }): Promise<DbMilestone> {
  const db = getDb()
  const id = crypto.randomUUID()
  const r = await db.query<DbMilestone>(
    `INSERT INTO milestones (id, project_id, title, description, target_date)
     VALUES ($1,$2,$3,$4,$5) RETURNING *`,
    [id, data.projectId, data.title, data.description ?? null, data.targetDate ?? null],
  )
  return r.rows[0]
}

export async function updateMilestone(id: string, data: Partial<Pick<DbMilestone, 'title' | 'description' | 'target_date' | 'status'>>): Promise<void> {
  const db = getDb()
  const sets: string[] = []
  const vals: unknown[] = []
  let i = 1
  for (const [k, v] of Object.entries(data)) { sets.push(`${k} = $${i++}`); vals.push(v) }
  if (sets.length === 0) return
  vals.push(id)
  await db.query(`UPDATE milestones SET ${sets.join(', ')} WHERE id = $${i}`, vals)
}

export async function deleteMilestone(id: string): Promise<void> {
  const db = getDb()
  await db.query(`DELETE FROM milestones WHERE id = $1`, [id])
}
