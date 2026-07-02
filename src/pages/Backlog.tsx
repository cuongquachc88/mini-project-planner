import { useState } from 'react'
import { useLiveQuery } from '@electric-sql/pglite-react'
import { Plus, Play, Check, Share2 } from 'lucide-react'
import type { DbSprint, DbWorkItem, DbCustomStage } from '@/types/db'
import { useProject } from '@/hooks/useProject'
import { useSprint } from '@/hooks/useSprint'
import { createSprint, startSprint, completeSprint } from '@/db/queries/sprints'
import { createWorkItem, updateWorkItem } from '@/db/queries/workItems'
import { exportSprintSummary } from '@/lib/htmlExport/exporter'
import { useStore } from '@/store'
import { Button } from '@/components/ui/Button'
import { PriorityBadge } from '@/components/PriorityBadge'
import { PointsBadge } from '@/components/PointsBadge'
import { fmtDate } from '@/lib/utils/dates'

function ItemRow({ item, onAssignToSprint, onRemoveFromSprint }: {
  item: DbWorkItem
  onAssignToSprint?: () => void
  onRemoveFromSprint?: () => void
}) {
  return (
    <div className="flex items-center gap-3 px-4 py-2 hover:bg-white/[0.03] group border-b border-white/[0.05] last:border-0 transition-colors">
      <span className="text-[11px] text-white/25 font-mono w-14 shrink-0 uppercase">{item.type}</span>
      <span className="text-[13px] text-white/75 flex-1 truncate">{item.title}</span>
      <PointsBadge points={item.story_points} />
      <PriorityBadge priority={item.priority} />
      {onAssignToSprint && (
        <button onClick={onAssignToSprint} className="text-[12px] text-violet-400 hover:text-violet-300 opacity-0 group-hover:opacity-100 transition-all">
          → Sprint
        </button>
      )}
      {onRemoveFromSprint && (
        <button onClick={onRemoveFromSprint} className="text-[12px] text-white/25 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all">
          Remove
        </button>
      )}
    </div>
  )
}

export default function Backlog() {
  const { project, projectId } = useProject()
  const { activeSprint, allSprints } = useSprint(projectId)
  const { currentUser } = useStore()
  const [newItemTitle, setNewItemTitle] = useState('')
  const [creatingItem, setCreatingItem] = useState(false)
  const [creatingSprint, setCreatingSprint] = useState(false)
  const [newSprintName, setNewSprintName] = useState('')

  const stagesResult = useLiveQuery<DbCustomStage>(`SELECT * FROM custom_stages WHERE project_id = $1 ORDER BY position`, [projectId ?? ''])
  const stages = stagesResult?.rows ?? []
  const firstStage = stages[0]

  const backlogResult = useLiveQuery<DbWorkItem>(
    `SELECT * FROM work_items WHERE project_id = $1 AND sprint_id IS NULL ORDER BY backlog_pos, created_at`,
    [projectId ?? ''],
  )
  const backlogItems = backlogResult?.rows ?? []

  const sprintItemsResult = useLiveQuery<DbWorkItem>(
    `SELECT * FROM work_items WHERE sprint_id = $1 ORDER BY backlog_pos, created_at`,
    [activeSprint?.id ?? ''],
  )
  const sprintItems = sprintItemsResult?.rows ?? []

  const plannedSprints = allSprints.filter((s) => s.status === 'planning')

  async function addBacklogItem() {
    if (!newItemTitle.trim() || !projectId || !currentUser) return
    await createWorkItem({ projectId, title: newItemTitle.trim(), stageId: firstStage?.id, reporterId: currentUser.id })
    setNewItemTitle('')
    setCreatingItem(false)
  }

  async function handleCreateSprint() {
    if (!newSprintName.trim() || !projectId) return
    await createSprint({ projectId, name: newSprintName.trim() })
    setNewSprintName('')
    setCreatingSprint(false)
  }

  async function moveToSprint(itemId: string, sprintId: string) {
    await updateWorkItem(itemId, { sprint_id: sprintId })
  }

  async function removeFromSprint(itemId: string) {
    await updateWorkItem(itemId, { sprint_id: null })
  }

  if (!project) return <div className="p-8 text-white/30 text-[13px]">Loading…</div>

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="shrink-0 px-6 pt-5 pb-4 border-b border-white/[0.05]">
        <div className="flex items-center justify-between">
          <h1 className="text-[13px] font-semibold text-white/60 uppercase tracking-wider">Backlog</h1>
          <div className="flex items-center gap-2">
            {creatingSprint ? (
              <div className="flex items-center gap-2">
                <input
                  autoFocus
                  className="input text-[13px] w-48"
                  placeholder="Sprint name"
                  value={newSprintName}
                  onChange={(e) => setNewSprintName(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleCreateSprint(); if (e.key === 'Escape') setCreatingSprint(false) }}
                />
                <Button onClick={handleCreateSprint} size="sm">Create</Button>
                <Button variant="ghost" size="sm" onClick={() => setCreatingSprint(false)}>Cancel</Button>
              </div>
            ) : (
              <Button variant="ghost" size="sm" className="gap-1.5" onClick={() => setCreatingSprint(true)}>
                <Plus size={12} strokeWidth={2.5} />New sprint
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto px-6 py-5 space-y-6">
        {/* Active Sprint */}
        {activeSprint && (
          <section>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-[13px] font-semibold text-white/80">{activeSprint.name}</span>
                <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-2 py-0.5 font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Active
                </span>
                {activeSprint.start_date && <span className="text-[11px] text-white/25">{fmtDate(activeSprint.start_date)} → {fmtDate(activeSprint.end_date)}</span>}
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={() => exportSprintSummary(activeSprint, stages, projectId ?? '')} className="gap-1.5">
                  <Share2 size={12} />Export
                </Button>
                <Button variant="outline" size="sm" onClick={() => completeSprint(activeSprint.id, null)} className="gap-1.5">
                  <Check size={12} />Complete
                </Button>
              </div>
            </div>
            <div className="bg-[#141416] border border-white/[0.07] rounded-xl overflow-hidden">
              {sprintItems.length === 0
                ? <p className="px-4 py-6 text-[13px] text-white/25 text-center">No items in this sprint</p>
                : sprintItems.map((item) => <ItemRow key={item.id} item={item} onRemoveFromSprint={() => removeFromSprint(item.id)} />)}
            </div>
          </section>
        )}

        {/* Planning Sprints */}
        {plannedSprints.map((sprint) => (
          <section key={sprint.id}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-[13px] font-semibold text-white/80">{sprint.name}</span>
                <span className="text-[11px] text-white/25 bg-white/[0.05] rounded-full px-2 py-0.5">Planning</span>
              </div>
              <Button size="sm" onClick={() => startSprint(sprint.id)} className="gap-1.5">
                <Play size={11} />Start sprint
              </Button>
            </div>
            <div className="bg-[#141416] border border-white/[0.07] rounded-xl overflow-hidden">
              <p className="px-4 py-4 text-[13px] text-white/25 text-center">No items assigned yet</p>
            </div>
          </section>
        ))}

        {/* Backlog */}
        <section>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[13px] font-semibold text-white/60 uppercase tracking-wider">
              Backlog
              {backlogItems.length > 0 && <span className="ml-2 text-white/25 normal-case font-normal">({backlogItems.length})</span>}
            </span>
          </div>
          <div className="bg-[#141416] border border-white/[0.07] rounded-xl overflow-hidden mb-2">
            {backlogItems.length === 0
              ? <p className="px-4 py-6 text-[13px] text-white/25 text-center">No backlog items</p>
              : backlogItems.map((item) => (
                <ItemRow
                  key={item.id}
                  item={item}
                  onAssignToSprint={activeSprint ? () => moveToSprint(item.id, activeSprint.id) : undefined}
                />
              ))}
          </div>

          {creatingItem ? (
            <div className="flex gap-2">
              <input
                autoFocus
                className="input flex-1 text-[13px]"
                placeholder="New backlog item title"
                value={newItemTitle}
                onChange={(e) => setNewItemTitle(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') addBacklogItem(); if (e.key === 'Escape') setCreatingItem(false) }}
              />
              <Button onClick={addBacklogItem} size="sm">Add</Button>
              <Button variant="ghost" size="sm" onClick={() => setCreatingItem(false)}>Cancel</Button>
            </div>
          ) : (
            <button
              onClick={() => setCreatingItem(true)}
              className="flex items-center gap-1.5 px-2 py-2 text-[12px] text-white/25 hover:text-white/60 hover:bg-white/[0.04] rounded-lg transition-all group/add"
            >
              <div className="w-4 h-4 rounded border border-dashed border-white/[0.12] flex items-center justify-center group-hover/add:border-violet-500/50 group-hover/add:text-violet-400 transition-colors">
                <Plus size={10} strokeWidth={2.5} />
              </div>
              <span>Add item to backlog</span>
            </button>
          )}
        </section>
      </div>
    </div>
  )
}
