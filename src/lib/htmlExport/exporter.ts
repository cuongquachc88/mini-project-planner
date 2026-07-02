import type { DbWorkItem, DbSprint, DbMeetingNote, DbCustomStage } from '@/types/db'
import { getComments, getItemLabels } from '@/db/queries/workItems'
import { getDb } from '@/db/client'
import { renderTaskCard } from './templates/taskCard'
import { renderSprintSummary } from './templates/sprintSummary'
import { renderMeetingNote } from './templates/meetingNote'
import { calcVelocity } from '@/lib/utils/points'
import type { SprintWithStats } from '@/types/domain'

function download(html: string, filename: string) {
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 10_000)
}

export async function exportTaskCard(item: DbWorkItem) {
  const db = getDb()
  const [labelIds, comments] = await Promise.all([
    getItemLabels(item.id),
    getComments(item.id),
  ])

  const labelsResult = labelIds.length > 0
    ? await db.query(`SELECT * FROM labels WHERE id = ANY($1)`, [labelIds])
    : { rows: [] }

  const assignee = item.assignee_id
    ? (await db.query(`SELECT * FROM users WHERE id = $1`, [item.assignee_id])).rows[0] ?? null
    : null

  const html = renderTaskCard(item, {
    assignee: assignee as never,
    labels: labelsResult.rows as never,
    comments: comments as never,
  })
  download(html, `task-${item.id.slice(0, 8)}.html`)
}

export async function exportSprintSummary(sprint: DbSprint, stages: DbCustomStage[], projectId: string) {
  const db = getDb()
  const itemsResult = await db.query<DbWorkItem>(
    `SELECT * FROM work_items WHERE sprint_id = $1 ORDER BY position`,
    [sprint.id],
  )
  const historyResult = await db.query<SprintWithStats>(
    `SELECT s.*, COALESCE(SUM(wi.story_points),0) as completed_points
     FROM sprints s
     LEFT JOIN work_items wi ON wi.sprint_id = s.id
       AND wi.stage_id IN (SELECT id FROM custom_stages WHERE is_done = TRUE AND project_id = $1)
     WHERE s.project_id = $1 AND s.status = 'completed'
     GROUP BY s.id ORDER BY s.created_at DESC LIMIT 3`,
    [projectId],
  )
  const velocity = calcVelocity(historyResult.rows)

  const html = renderSprintSummary(sprint, itemsResult.rows, stages, velocity)
  download(html, `sprint-${sprint.name.replace(/\s+/g, '-').toLowerCase()}.html`)
}

export async function exportMeetingNote(note: DbMeetingNote) {
  const html = renderMeetingNote(note)
  download(html, `meeting-${note.meeting_date}-${note.id.slice(0, 6)}.html`)
}
