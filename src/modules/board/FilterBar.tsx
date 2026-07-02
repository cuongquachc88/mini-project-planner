import { X } from 'lucide-react'
import { useLiveQuery } from '@electric-sql/pglite-react'
import type { DbUser, DbLabel, Priority, WorkItemType } from '@/types/db'
import { useStore } from '@/store'
import { cn } from '@/lib/utils/cn'

const TYPES: WorkItemType[] = ['story', 'bug', 'spike', 'task', 'action', 'request']
const PRIORITIES: Priority[] = ['critical', 'high', 'medium', 'low']

export function FilterBar({ projectId }: { projectId: string }) {
  const { boardFilters, setBoardFilters, clearBoardFilters } = useStore()

  const usersResult = useLiveQuery<DbUser>(`SELECT * FROM users ORDER BY name`, [])
  const users = usersResult?.rows ?? []

  const labelsResult = useLiveQuery<DbLabel>(
    `SELECT * FROM labels WHERE project_id = $1 ORDER BY name`,
    [projectId],
  )
  const labels = labelsResult?.rows ?? []

  const hasFilters = boardFilters.priority || boardFilters.type || boardFilters.assigneeId || boardFilters.labelId

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <select
        className={cn('input text-xs py-1', boardFilters.type && 'border-brand-500 text-brand-300')}
        value={boardFilters.type ?? ''}
        onChange={(e) => setBoardFilters({ type: (e.target.value as WorkItemType) || undefined })}
      >
        <option value="">All types</option>
        {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
      </select>

      <select
        className={cn('input text-xs py-1', boardFilters.priority && 'border-brand-500 text-brand-300')}
        value={boardFilters.priority ?? ''}
        onChange={(e) => setBoardFilters({ priority: (e.target.value as Priority) || undefined })}
      >
        <option value="">All priorities</option>
        {PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
      </select>

      {users.length > 0 && (
        <select
          className={cn('input text-xs py-1', boardFilters.assigneeId && 'border-brand-500 text-brand-300')}
          value={boardFilters.assigneeId ?? ''}
          onChange={(e) => setBoardFilters({ assigneeId: e.target.value || undefined })}
        >
          <option value="">All assignees</option>
          {users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
        </select>
      )}

      {labels.length > 0 && (
        <select
          className={cn('input text-xs py-1', boardFilters.labelId && 'border-brand-500 text-brand-300')}
          value={boardFilters.labelId ?? ''}
          onChange={(e) => setBoardFilters({ labelId: e.target.value || undefined })}
        >
          <option value="">All labels</option>
          {labels.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
        </select>
      )}

      {hasFilters && (
        <button
          onClick={clearBoardFilters}
          className="flex items-center gap-1 text-xs text-slate-500 hover:text-red-400 transition-colors"
        >
          <X size={11} />
          Clear
        </button>
      )}
    </div>
  )
}
