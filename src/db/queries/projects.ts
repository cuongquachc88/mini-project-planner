import type { DbProject, DbCustomStage, DbLabel } from '@/types/db'
import { getDb } from '../client'

export async function listProjects(): Promise<DbProject[]> {
  const db = getDb()
  const r = await db.query<DbProject>(`SELECT * FROM projects ORDER BY created_at DESC`)
  return r.rows
}

export async function getProject(id: string): Promise<DbProject | null> {
  const db = getDb()
  const r = await db.query<DbProject>(`SELECT * FROM projects WHERE id = $1`, [id])
  return r.rows[0] ?? null
}

export async function createProject(data: {
  name: string
  description?: string
  key: string
  color?: string
  icon?: string
  ownerId: string
}): Promise<DbProject> {
  const db = getDb()
  const id = crypto.randomUUID()
  const r = await db.query<DbProject>(
    `INSERT INTO projects (id, name, description, key, owner_id, color, icon)
     VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
    [id, data.name, data.description ?? null, data.key.toUpperCase(), data.ownerId, data.color ?? null, data.icon ?? null],
  )
  const project = r.rows[0]

  // Seed default stages
  const stages = ['Backlog', 'In Progress', 'Review', 'Done']
  for (let i = 0; i < stages.length; i++) {
    await db.exec(
      `INSERT INTO custom_stages (id, project_id, name, position, is_done) VALUES ('${crypto.randomUUID()}','${project.id}','${stages[i]}',${i},${i === stages.length - 1})`,
    )
  }

  // Add owner as admin member
  await db.exec(
    `INSERT INTO project_members (project_id, user_id, role) VALUES ('${project.id}','${data.ownerId}','admin') ON CONFLICT DO NOTHING`,
  )

  return project
}

export async function updateProject(id: string, data: Partial<Pick<DbProject, 'name' | 'description' | 'color' | 'icon' | 'archived' | 'key'>>): Promise<void> {
  const db = getDb()
  const sets: string[] = []
  const vals: unknown[] = []
  let i = 1
  if (data.name !== undefined) { sets.push(`name = $${i++}`); vals.push(data.name) }
  if (data.description !== undefined) { sets.push(`description = $${i++}`); vals.push(data.description) }
  if (data.color !== undefined) { sets.push(`color = $${i++}`); vals.push(data.color) }
  if (data.icon !== undefined) { sets.push(`icon = $${i++}`); vals.push(data.icon) }
  if (data.archived !== undefined) { sets.push(`archived = $${i++}`); vals.push(data.archived) }
  if (data.key !== undefined) { sets.push(`key = $${i++}`); vals.push(data.key) }
  if (sets.length === 0) return
  vals.push(id)
  await db.query(`UPDATE projects SET ${sets.join(', ')} WHERE id = $${i}`, vals)
}

export async function isProjectKeyTaken(key: string, excludeId: string): Promise<boolean> {
  const db = getDb()
  const r = await db.query<{ count: string }>(
    `SELECT COUNT(*) as count FROM projects WHERE key = $1 AND id != $2`,
    [key.toUpperCase(), excludeId],
  )
  return parseInt(r.rows[0]?.count ?? '0', 10) > 0
}

export async function getStages(projectId: string): Promise<DbCustomStage[]> {
  const db = getDb()
  const r = await db.query<DbCustomStage>(
    `SELECT * FROM custom_stages WHERE project_id = $1 ORDER BY position`,
    [projectId],
  )
  return r.rows
}

export async function createStage(projectId: string, name: string, color?: string): Promise<DbCustomStage> {
  const db = getDb()
  const maxPos = await db.query<{ max: number }>(`SELECT COALESCE(MAX(position),0) as max FROM custom_stages WHERE project_id = $1`, [projectId])
  const pos = (maxPos.rows[0]?.max ?? 0) + 1
  const id = crypto.randomUUID()
  const r = await db.query<DbCustomStage>(
    `INSERT INTO custom_stages (id, project_id, name, color, position) VALUES ($1,$2,$3,$4,$5) RETURNING *`,
    [id, projectId, name, color ?? null, pos],
  )
  return r.rows[0]
}

export async function updateStage(id: string, data: Partial<Pick<DbCustomStage, 'name' | 'color' | 'position' | 'is_done'>>): Promise<void> {
  const db = getDb()
  const sets: string[] = []
  const vals: unknown[] = []
  let i = 1
  if (data.name !== undefined) { sets.push(`name = $${i++}`); vals.push(data.name) }
  if (data.color !== undefined) { sets.push(`color = $${i++}`); vals.push(data.color) }
  if (data.position !== undefined) { sets.push(`position = $${i++}`); vals.push(data.position) }
  if (data.is_done !== undefined) { sets.push(`is_done = $${i++}`); vals.push(data.is_done) }
  if (sets.length === 0) return
  vals.push(id)
  await db.query(`UPDATE custom_stages SET ${sets.join(', ')} WHERE id = $${i}`, vals)
}

export async function deleteStage(id: string): Promise<void> {
  const db = getDb()
  await db.query(`DELETE FROM custom_stages WHERE id = $1`, [id])
}

export async function getLabels(projectId: string): Promise<DbLabel[]> {
  const db = getDb()
  const r = await db.query<DbLabel>(`SELECT * FROM labels WHERE project_id = $1 ORDER BY name`, [projectId])
  return r.rows
}

export async function createLabel(projectId: string, name: string, color: string): Promise<DbLabel> {
  const db = getDb()
  const id = crypto.randomUUID()
  const r = await db.query<DbLabel>(
    `INSERT INTO labels (id, project_id, name, color) VALUES ($1,$2,$3,$4) RETURNING *`,
    [id, projectId, name, color],
  )
  return r.rows[0]
}

export async function deleteLabel(id: string): Promise<void> {
  const db = getDb()
  await db.query(`DELETE FROM labels WHERE id = $1`, [id])
}
