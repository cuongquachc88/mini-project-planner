import { useState } from 'react'
import { useLiveQuery } from '@electric-sql/pglite-react'
import { Plus, SlidersHorizontal, ArrowRight } from 'lucide-react'
import type { DbCustomStage, DbWorkItem } from '@/types/db'
import { useProject } from '@/hooks/useProject'
import { useSprint } from '@/hooks/useSprint'
import { createWorkItem, updateWorkItem } from '@/db/queries/workItems'
import { useStore } from '@/store'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils/cn'
import { PriorityBadge } from '@/components/PriorityBadge'
import { PointsBadge } from '@/components/PointsBadge'
import { WorkItemDetail } from '@/modules/board/WorkItemDetail'
import { FilterBar } from '@/modules/board/FilterBar'
import {
  DndContext, DragOverlay, closestCenter,
  PointerSensor, useSensor, useSensors,
  type DragEndEvent, type DragStartEvent,
} from '@dnd-kit/core'
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { useDroppable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'

/* ─── Card ──────────────────────────────────────────── */
function WorkItemCard({ item, isDragging, onClick }: {
  item: DbWorkItem; isDragging?: boolean; onClick?: () => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging: sorting } = useSortable({ id: item.id })

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      {...attributes}
      className={cn(
        'group relative rounded-lg border bg-[#16161a] p-3 select-none cursor-default',
        'border-white/[0.08] hover:border-white/[0.18] hover:bg-[#1c1c22]',
        'transition-all duration-100 shadow-sm shadow-black/40',
        (sorting || isDragging) && 'opacity-40 scale-[0.97] rotate-1 shadow-xl',
      )}
    >
      {/* colored left accent */}
      <div className="absolute left-0 top-3 bottom-3 w-[3px] rounded-r-full opacity-0 group-hover:opacity-100 transition-opacity bg-violet-500" />

      <div className="flex items-start justify-between gap-2">
        <div {...listeners} className="flex-1 cursor-grab active:cursor-grabbing min-w-0">
          <p className="text-[13px] text-white/75 font-medium leading-[1.4] mb-3 group-hover:text-white transition-colors pr-1">
            {item.title}
          </p>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] text-white/25 font-mono uppercase tracking-wider bg-white/[0.05] rounded px-1.5 py-0.5 border border-white/[0.05]">
              {item.type}
            </span>
            <PriorityBadge priority={item.priority} />
            <PointsBadge points={item.story_points} />
          </div>
        </div>
        <button
          onClick={onClick}
          className="shrink-0 w-6 h-6 rounded flex items-center justify-center text-white/20 hover:text-white/70 hover:bg-white/[0.07] opacity-0 group-hover:opacity-100 transition-all -mt-0.5 -mr-0.5"
        >
          <ArrowRight size={12} strokeWidth={2} />
        </button>
      </div>
    </div>
  )
}

/* ─── Column ─────────────────────────────────────────── */
function KanbanColumn({ stage, items, onAddItem, onOpenItem }: {
  stage: DbCustomStage; items: DbWorkItem[]
  onAddItem: () => void; onOpenItem: (item: DbWorkItem) => void
}) {
  const { setNodeRef, isOver } = useDroppable({ id: stage.id })

  const accent = stage.color ?? '#7c3aed'

  return (
    <div className="flex flex-col w-[280px] shrink-0">

      {/* Column header */}
      <div className="flex items-center gap-2.5 mb-3 px-1">
        <div
          className="w-2.5 h-2.5 rounded-full shrink-0 ring-2 ring-black"
          style={{ backgroundColor: accent }}
        />
        <span className="text-[13px] font-semibold text-white/70 tracking-tight">{stage.name}</span>
        {items.length > 0 && (
          <span
            className="ml-auto text-[10px] font-semibold px-1.5 py-0.5 rounded-full tabular-nums"
            style={{ backgroundColor: `${accent}20`, color: accent }}
          >
            {items.length}
          </span>
        )}
      </div>

      {/* Drop zone */}
      <div
        ref={setNodeRef}
        className={cn(
          'flex-1 flex flex-col gap-2 rounded-xl p-2 min-h-[200px] transition-all duration-150',
          'border border-dashed border-white/[0.06] bg-white/[0.015]',
          isOver && 'border-violet-500/50 bg-violet-500/[0.04] scale-[1.01]',
        )}
      >
        <SortableContext items={items.map(i => i.id)} strategy={verticalListSortingStrategy}>
          {items.map(item => (
            <WorkItemCard key={item.id} item={item} onClick={() => onOpenItem(item)} />
          ))}
        </SortableContext>

        {items.length === 0 && !isOver && (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-[11px] text-white/15 select-none">Drop here</p>
          </div>
        )}
      </div>

      {/* Add item inline */}
      <button
        onClick={onAddItem}
        className="flex items-center gap-1.5 px-2 py-2 mt-2 text-[12px] text-white/25 hover:text-white/60 hover:bg-white/[0.04] rounded-lg transition-all group/add"
      >
        <div className="w-4 h-4 rounded border border-dashed border-white/[0.12] flex items-center justify-center group-hover/add:border-violet-500/50 group-hover/add:text-violet-400 transition-colors">
          <Plus size={10} strokeWidth={2.5} />
        </div>
        <span>Add item</span>
      </button>
    </div>
  )
}

/* ─── Board page ─────────────────────────────────────── */
export default function Board() {
  const { project, projectId } = useProject()
  const { activeSprint } = useSprint(projectId)
  const { currentUser, setActiveDragId, boardFilters } = useStore()
  const [addingToStage, setAddingToStage] = useState<string | null>(null)
  const [newTitle, setNewTitle] = useState('')
  const [newType, setNewType] = useState<'task' | 'story' | 'bug' | 'spike'>('task')
  const [newPriority, setNewPriority] = useState<'medium' | 'high' | 'low' | 'critical'>('medium')
  const [newPoints, setNewPoints] = useState('')
  const [newDesc, setNewDesc] = useState('')
  const [newAC, setNewAC] = useState('')
  const [selectedItem, setSelectedItem] = useState<DbWorkItem | null>(null)
  const [showFilters, setShowFilters] = useState(false)
  const [activeItem, setActiveItem] = useState<DbWorkItem | null>(null)

  const stages = useLiveQuery<DbCustomStage>(
    `SELECT * FROM custom_stages WHERE project_id = $1 ORDER BY position`,
    [projectId ?? ''],
  )?.rows ?? []

  // Build parameterized filter query
  const fc: string[] = ['wi.project_id = $1']
  const fv: unknown[] = [projectId ?? '']
  let pi = 2
  if (activeSprint)           { fc.push(`wi.sprint_id = $${pi++}`);       fv.push(activeSprint.id) }
  if (boardFilters.type)      { fc.push(`wi.type = $${pi++}`);            fv.push(boardFilters.type) }
  if (boardFilters.priority)  { fc.push(`wi.priority = $${pi++}`);        fv.push(boardFilters.priority) }
  if (boardFilters.assigneeId){ fc.push(`wi.assignee_id = $${pi++}`);     fv.push(boardFilters.assigneeId) }
  if (boardFilters.labelId)   { fc.push(`EXISTS (SELECT 1 FROM work_item_labels wil WHERE wil.work_item_id = wi.id AND wil.label_id = $${pi++})`); fv.push(boardFilters.labelId) }

  const items = useLiveQuery<DbWorkItem>(
    `SELECT wi.* FROM work_items wi WHERE ${fc.join(' AND ')} ORDER BY wi.position`,
    fv,
  )?.rows ?? []

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }))

  function onDragStart(e: DragStartEvent) {
    setActiveItem(items.find(i => i.id === e.active.id) ?? null)
    setActiveDragId(String(e.active.id))
  }

  async function onDragEnd(e: DragEndEvent) {
    setActiveDragId(null); setActiveItem(null)
    const { active, over } = e
    if (!over || active.id === over.id) return
    const targetId = items.find(i => i.id === over.id)?.stage_id ?? stages.find(s => s.id === over.id)?.id
    if (targetId) await updateWorkItem(String(active.id), { stage_id: targetId })
  }

  function resetAddForm() {
    setNewTitle(''); setNewType('task'); setNewPriority('medium'); setNewPoints('')
    setNewDesc(''); setNewAC('')
    setAddingToStage(null)
  }

  async function handleAdd(stageId: string) {
    if (!newTitle.trim() || !projectId || !currentUser) return
    await createWorkItem({
      projectId, title: newTitle.trim(), stageId,
      sprintId: activeSprint?.id, reporterId: currentUser.id,
      type: newType, priority: newPriority,
      storyPoints: newPoints ? Number(newPoints) : undefined,
      description: newDesc.trim() || undefined,
      acceptanceCriteria: newAC.trim() || undefined,
    })
    resetAddForm()
  }

  if (!project) return <div className="p-10 text-white/30 text-sm">Project not found</div>

  const totalItems = items.length
  const doneItems  = items.filter(i => stages.find(s => s.id === i.stage_id)?.is_done).length

  return (
    <div className="flex flex-col h-full overflow-hidden">

      {/* Page header */}
      <div className="shrink-0 px-6 pt-5 pb-4 border-b border-white/[0.05]">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-[16px] font-semibold text-white tracking-tight">{project.name}</h1>
            <div className="flex items-center gap-3 mt-1">
              {activeSprint ? (
                <span className="inline-flex items-center gap-1.5 text-[11px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-2 py-0.5 font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Sprint · {activeSprint.name}
                </span>
              ) : (
                <span className="text-[12px] text-white/30">All items</span>
              )}
              {totalItems > 0 && (
                <>
                  <span className="text-white/10">·</span>
                  <span className="text-[12px] text-white/30">{totalItems} items</span>
                  {doneItems > 0 && (
                    <>
                      <span className="text-white/10">·</span>
                      <span className="text-[12px] text-emerald-500/70">{doneItems} done</span>
                    </>
                  )}
                </>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button
              size="sm" variant={showFilters ? 'outline' : 'ghost'}
              onClick={() => setShowFilters(v => !v)}
              className="gap-1.5"
            >
              <SlidersHorizontal size={12} strokeWidth={2} />
              Filters
            </Button>
            <Button
              size="sm"
              onClick={() => setAddingToStage(stages[0]?.id ?? null)}
              className="gap-1.5"
            >
              <Plus size={13} strokeWidth={2.5} />
              Add item
            </Button>
          </div>
        </div>

        {/* Workflow progress bar */}
        {stages.length > 0 && totalItems > 0 && (
          <div className="flex items-center gap-1 mt-4 h-1.5">
            {stages.map(stage => {
              const count = items.filter(i => i.stage_id === stage.id).length
              const w = totalItems > 0 ? (count / totalItems) * 100 : 0
              return w > 0 ? (
                <div
                  key={stage.id}
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${w}%`, backgroundColor: stage.color ?? '#7c3aed', opacity: stage.is_done ? 1 : 0.5 }}
                  title={`${stage.name}: ${count}`}
                />
              ) : null
            })}
          </div>
        )}
      </div>

      {/* Filter bar */}
      {showFilters && projectId && (
        <div className="shrink-0 px-6 py-2.5 border-b border-white/[0.05] bg-white/[0.01]">
          <FilterBar projectId={projectId} />
        </div>
      )}

      {/* Kanban board */}
      <div className="flex-1 overflow-auto px-6 py-5">
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={onDragStart} onDragEnd={onDragEnd}>
          <div className="flex gap-4 pb-8 h-full" style={{ width: 'max-content', minWidth: '100%' }}>
            {stages.map(stage => (
              <KanbanColumn
                key={stage.id} stage={stage}
                items={items.filter(i => i.stage_id === stage.id)}
                onAddItem={() => setAddingToStage(stage.id)}
                onOpenItem={setSelectedItem}
              />
            ))}
          </div>
          <DragOverlay dropAnimation={{ duration: 180, easing: 'ease' }}>
            {activeItem ? <WorkItemCard item={activeItem} isDragging /> : null}
          </DragOverlay>
        </DndContext>
      </div>

      {/* Quick add modal */}
      {addingToStage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={e => e.target === e.currentTarget && resetAddForm()}>
          <div className="w-full max-w-lg rounded-2xl border border-white/[0.08] shadow-2xl shadow-black/70 overflow-hidden animate-fade-in bg-[#111113] max-h-[92vh] flex flex-col">
            {/* Header */}
            <div className="px-5 pt-5 pb-4 border-b border-white/[0.06] flex items-center justify-between">
              <h3 className="text-[13px] font-semibold text-white/80 uppercase tracking-wider">New work item</h3>
              <button onClick={resetAddForm} className="text-white/20 hover:text-white/60 transition-colors text-lg leading-none">×</button>
            </div>

            <div className="p-5 space-y-4 overflow-y-auto flex-1">
              {/* Title */}
              <div>
                <label className="block text-[10px] font-medium text-white/30 uppercase tracking-wider mb-1.5">Title</label>
                <input
                  autoFocus
                  className="input w-full"
                  placeholder="What needs to be done?"
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && e.metaKey) handleAdd(addingToStage); if (e.key === 'Escape') resetAddForm() }}
                />
              </div>

              {/* Type · Priority · Points */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[10px] font-medium text-white/30 uppercase tracking-wider mb-1.5">Type</label>
                  <select className="input w-full" value={newType} onChange={e => setNewType(e.target.value as typeof newType)}>
                    <option value="task">Task</option>
                    <option value="story">Story</option>
                    <option value="bug">Bug</option>
                    <option value="spike">Spike</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-medium text-white/30 uppercase tracking-wider mb-1.5">Priority</label>
                  <select className="input w-full" value={newPriority} onChange={e => setNewPriority(e.target.value as typeof newPriority)}>
                    <option value="critical">Critical</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-medium text-white/30 uppercase tracking-wider mb-1.5">Points</label>
                  <input
                    type="number"
                    min={0}
                    max={99}
                    className="input w-full"
                    placeholder="—"
                    value={newPoints}
                    onChange={e => setNewPoints(e.target.value)}
                  />
                </div>
              </div>

              {/* Stage */}
              <div>
                <label className="block text-[10px] font-medium text-white/30 uppercase tracking-wider mb-1.5">Stage</label>
                <select className="input w-full" value={addingToStage} onChange={e => setAddingToStage(e.target.value)}>
                  {stages.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>

              {/* Description */}
              <div>
                <label className="block text-[10px] font-medium text-white/30 uppercase tracking-wider mb-1.5">Description</label>
                <textarea
                  className="w-full bg-white/[0.04] border border-white/[0.09] rounded-lg px-3 py-2 text-[12px] text-white/70 resize-none focus:outline-none focus:border-violet-500/40 placeholder:text-white/20 transition-colors leading-relaxed"
                  rows={4}
                  placeholder="What is this work item about?"
                  value={newDesc}
                  onChange={e => setNewDesc(e.target.value)}
                />
              </div>

              {/* Acceptance Criteria */}
              <div>
                <label className="block text-[10px] font-medium text-white/30 uppercase tracking-wider mb-1.5">Acceptance Criteria</label>
                <textarea
                  className="w-full bg-white/[0.04] border border-white/[0.09] rounded-lg px-3 py-2 text-[12px] text-white/70 font-mono resize-none focus:outline-none focus:border-violet-500/40 placeholder:text-white/20 transition-colors leading-relaxed"
                  rows={4}
                  placeholder={"- [ ] Given … When … Then …\n- [ ] …"}
                  value={newAC}
                  onChange={e => setNewAC(e.target.value)}
                />
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-1">
                <Button onClick={() => handleAdd(addingToStage)} size="sm" className="flex-1">Create</Button>
                <Button variant="ghost" size="sm" onClick={resetAddForm}>Cancel</Button>
              </div>
              <p className="text-[10px] text-white/20 text-center">⌘ Enter to create</p>
            </div>
          </div>
        </div>
      )}

      {selectedItem && projectId && (
        <WorkItemDetail
          item={selectedItem} projectId={projectId}
          onClose={() => setSelectedItem(null)}
          onDeleted={() => setSelectedItem(null)}
        />
      )}
    </div>
  )
}
