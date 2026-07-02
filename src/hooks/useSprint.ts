import { useLiveQuery } from '@electric-sql/pglite-react'
import type { DbSprint } from '@/types/db'

export function useSprint(projectId: string | null) {
  const result = useLiveQuery<DbSprint>(
    `SELECT * FROM sprints WHERE project_id = $1 AND status = 'active' LIMIT 1`,
    [projectId ?? ''],
  )
  const allResult = useLiveQuery<DbSprint>(
    `SELECT * FROM sprints WHERE project_id = $1 ORDER BY created_at DESC`,
    [projectId ?? ''],
  )
  return {
    activeSprint: result?.rows[0] ?? null,
    allSprints: allResult?.rows ?? [],
    loading: result === undefined,
  }
}
