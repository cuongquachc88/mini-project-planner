import type { DbWorkItem, DbWorkItemAttachment, Priority, WorkItemType } from '@/types/db'
import { getDb } from '../client'

export interface WorkItemFilter {
  stageId?: string
  sprintId?: string | null
  epicId?: string
  assigneeId?: string
  priority?: Priority
  type?: WorkItemType
  backlogOnly?: boolean
}

export async function getWorkItems(projectId: string, filter: WorkItemFilter = {}): Promise<DbWorkItem[]> {
  const db = getDb()
  const conditions = ['wi.project_id = $1']
  const vals: unknown[] = [projectId]
  let i = 2

  if (filter.stageId) { conditions.push(`wi.stage_id = $${i++}`); vals.push(filter.stageId) }
  if (filter.sprintId !== undefined) {
    if (filter.sprintId === null) { conditions.push(`wi.sprint_id IS NULL`) }
    else { conditions.push(`wi.sprint_id = $${i++}`); vals.push(filter.sprintId) }
  }
  if (filter.epicId) { conditions.push(`wi.epic_id = $${i++}`); vals.push(filter.epicId) }
  if (filter.assigneeId) { conditions.push(`wi.assignee_id = $${i++}`); vals.push(filter.assigneeId) }
  if (filter.priority) { conditions.push(`wi.priority = $${i++}`); vals.push(filter.priority) }
  if (filter.type) { conditions.push(`wi.type = $${i++}`); vals.push(filter.type) }
  if (filter.backlogOnly) { conditions.push(`wi.sprint_id IS NULL`) }

  const r = await db.query<DbWorkItem>(
    `SELECT * FROM work_items wi WHERE ${conditions.join(' AND ')} ORDER BY wi.position, wi.created_at`,
    vals,
  )
  return r.rows
}

export async function getWorkItem(id: string): Promise<DbWorkItem | null> {
  const db = getDb()
  const r = await db.query<DbWorkItem>(`SELECT * FROM work_items WHERE id = $1`, [id])
  return r.rows[0] ?? null
}

export async function createWorkItem(data: {
  projectId: string
  title: string
  type?: WorkItemType
  priority?: Priority
  stageId?: string
  sprintId?: string
  epicId?: string
  milestoneId?: string
  parentId?: string
  assigneeId?: string
  reporterId?: string
  storyPoints?: number
  dueDate?: string
  description?: string
}): Promise<DbWorkItem> {
  const db = getDb()
  const id = crypto.randomUUID()
  const maxPos = await db.query<{ max: number }>(
    `SELECT COALESCE(MAX(position),0) as max FROM work_items WHERE project_id = $1 AND stage_id ${data.stageId ? `= '${data.stageId}'` : 'IS NULL'}`,
    [data.projectId],
  )
  const pos = (maxPos.rows[0]?.max ?? 0) + 1

  const r = await db.query<DbWorkItem>(
    `INSERT INTO work_items
      (id, project_id, title, type, priority, stage_id, sprint_id, epic_id, milestone_id,
       parent_id, assignee_id, reporter_id, story_points, due_date, description, position)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)
     RETURNING *`,
    [
      id, data.projectId, data.title, data.type ?? 'task', data.priority ?? 'medium',
      data.stageId ?? null, data.sprintId ?? null, data.epicId ?? null, data.milestoneId ?? null,
      data.parentId ?? null, data.assigneeId ?? null, data.reporterId ?? null,
      data.storyPoints ?? null, data.dueDate ?? null, data.description ?? null, pos,
    ],
  )
  return r.rows[0]
}

export async function updateWorkItem(id: string, data: Partial<DbWorkItem>): Promise<void> {
  const db = getDb()
  const allowed: (keyof DbWorkItem)[] = [
    'title', 'description', 'type', 'priority', 'story_points', 'assignee_id',
    'reporter_id', 'due_date', 'stage_id', 'sprint_id', 'epic_id', 'milestone_id',
    'parent_id', 'wiki_page_id', 'acceptance_criteria', 'tech_notes',
    'position', 'backlog_pos',
  ]
  const sets: string[] = []
  const vals: unknown[] = []
  let i = 1
  for (const key of allowed) {
    if (key in data) { sets.push(`${key} = $${i++}`); vals.push((data as Record<string, unknown>)[key]) }
  }
  if (sets.length === 0) return
  sets.push(`updated_at = NOW()`)
  vals.push(id)
  await db.query(`UPDATE work_items SET ${sets.join(', ')} WHERE id = $${i}`, vals)
}

export async function deleteWorkItem(id: string): Promise<void> {
  const db = getDb()
  await db.query(`DELETE FROM work_items WHERE id = $1`, [id])
}

export async function moveWorkItemToStage(id: string, stageId: string, position: number): Promise<void> {
  const db = getDb()
  await db.query(
    `UPDATE work_items SET stage_id = $1, position = $2, updated_at = NOW() WHERE id = $3`,
    [stageId, position, id],
  )
}

export async function getItemLabels(workItemId: string): Promise<string[]> {
  const db = getDb()
  const r = await db.query<{ label_id: string }>(
    `SELECT label_id FROM work_item_labels WHERE work_item_id = $1`,
    [workItemId],
  )
  return r.rows.map((row) => row.label_id)
}

export async function setItemLabels(workItemId: string, labelIds: string[]): Promise<void> {
  const db = getDb()
  await db.query(`DELETE FROM work_item_labels WHERE work_item_id = $1`, [workItemId])
  for (const labelId of labelIds) {
    await db.query(
      `INSERT INTO work_item_labels (work_item_id, label_id) VALUES ($1,$2) ON CONFLICT DO NOTHING`,
      [workItemId, labelId],
    )
  }
}

export async function getComments(workItemId: string) {
  const db = getDb()
  const r = await db.query(
    `SELECT c.*, u.name as author_name, u.avatar_url as author_avatar
     FROM comments c
     LEFT JOIN users u ON u.id = c.author_id
     WHERE c.work_item_id = $1
     ORDER BY c.created_at`,
    [workItemId],
  )
  return r.rows
}

export async function addComment(workItemId: string, authorId: string, body: string) {
  const db = getDb()
  const id = crypto.randomUUID()
  const r = await db.query(
    `INSERT INTO comments (id, work_item_id, author_id, body) VALUES ($1,$2,$3,$4) RETURNING *`,
    [id, workItemId, authorId, body],
  )
  return r.rows[0]
}

export async function getSubtasks(parentId: string): Promise<DbWorkItem[]> {
  const db = getDb()
  const r = await db.query<DbWorkItem>(
    `SELECT * FROM work_items WHERE parent_id = $1 ORDER BY position, created_at`,
    [parentId],
  )
  return r.rows
}

export async function getAttachments(workItemId: string): Promise<Omit<DbWorkItemAttachment, 'data'>[]> {
  const db = getDb()
  const r = await db.query<Omit<DbWorkItemAttachment, 'data'>>(
    `SELECT id, work_item_id, filename, mime_type, size_bytes, created_at FROM work_item_attachments WHERE work_item_id = $1 ORDER BY created_at`,
    [workItemId],
  )
  return r.rows
}

export async function getAttachmentData(id: string): Promise<string | null> {
  const db = getDb()
  const r = await db.query<{ data: string }>(`SELECT data FROM work_item_attachments WHERE id = $1`, [id])
  return r.rows[0]?.data ?? null
}

export async function addAttachment(workItemId: string, filename: string, mimeType: string, data: string): Promise<Omit<DbWorkItemAttachment, 'data'>> {
  const db = getDb()
  const id = crypto.randomUUID()
  const sizeBytes = Math.round(data.length * 0.75)
  const r = await db.query<Omit<DbWorkItemAttachment, 'data'>>(
    `INSERT INTO work_item_attachments (id, work_item_id, filename, mime_type, size_bytes, data) VALUES ($1,$2,$3,$4,$5,$6) RETURNING id, work_item_id, filename, mime_type, size_bytes, created_at`,
    [id, workItemId, filename, mimeType, sizeBytes, data],
  )
  return r.rows[0]
}

export async function deleteAttachment(id: string): Promise<void> {
  const db = getDb()
  await db.query(`DELETE FROM work_item_attachments WHERE id = $1`, [id])
}
