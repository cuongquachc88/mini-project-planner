import type { DbUser } from '@/types/db'
import { getDb } from '../client'

export async function createUser(data: { name: string; email: string; role?: 'admin' | 'teammate' }): Promise<DbUser> {
  const db = getDb()
  const id = crypto.randomUUID()
  const r = await db.query<DbUser>(
    `INSERT INTO users (id, email, name, role) VALUES ($1,$2,$3,$4) RETURNING *`,
    [id, data.email, data.name, data.role ?? 'teammate'],
  )
  return r.rows[0]
}

export async function updateUser(id: string, data: { name: string; email: string }): Promise<DbUser> {
  const db = getDb()
  const r = await db.query<DbUser>(
    `UPDATE users SET name = $1, email = $2 WHERE id = $3 RETURNING *`,
    [data.name, data.email, id],
  )
  return r.rows[0]
}

export async function getUserById(id: string): Promise<DbUser | null> {
  const db = getDb()
  const r = await db.query<DbUser>(`SELECT * FROM users WHERE id = $1`, [id])
  return r.rows[0] ?? null
}

export async function listUsers(): Promise<DbUser[]> {
  const db = getDb()
  const r = await db.query<DbUser>(`SELECT * FROM users ORDER BY name`)
  return r.rows
}

export async function getProjectMembers(projectId: string): Promise<DbUser[]> {
  const db = getDb()
  const r = await db.query<DbUser>(
    `SELECT u.* FROM users u
     JOIN project_members pm ON pm.user_id = u.id
     WHERE pm.project_id = $1
     ORDER BY u.name`,
    [projectId],
  )
  return r.rows
}

export async function addProjectMember(projectId: string, userId: string, role: 'admin' | 'teammate' = 'teammate'): Promise<void> {
  const db = getDb()
  await db.query(
    `INSERT INTO project_members (project_id, user_id, role) VALUES ($1,$2,$3) ON CONFLICT (project_id, user_id) DO UPDATE SET role = $3`,
    [projectId, userId, role],
  )
}

export async function removeProjectMember(projectId: string, userId: string): Promise<void> {
  const db = getDb()
  await db.query(`DELETE FROM project_members WHERE project_id = $1 AND user_id = $2`, [projectId, userId])
}

export async function getAppMeta(key: string): Promise<string | null> {
  const db = getDb()
  const r = await db.query<{ value: string }>(`SELECT value FROM app_meta WHERE key = $1`, [key])
  return r.rows[0]?.value ?? null
}

export async function setAppMeta(key: string, value: string): Promise<void> {
  const db = getDb()
  await db.query(
    `INSERT INTO app_meta (key, value) VALUES ($1,$2) ON CONFLICT (key) DO UPDATE SET value = $2`,
    [key, value],
  )
}
