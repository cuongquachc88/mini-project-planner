import { useLiveQuery } from '@electric-sql/pglite-react'
import { useParams } from 'react-router-dom'
import type { DbProject } from '@/types/db'

export function useProject() {
  const { projectId } = useParams<{ projectId: string }>()
  const result = useLiveQuery<DbProject>(
    `SELECT * FROM projects WHERE id = $1`,
    [projectId ?? ''],
  )
  return {
    project: result?.rows[0] ?? null,
    projectId: projectId ?? null,
    loading: result === undefined,
  }
}
