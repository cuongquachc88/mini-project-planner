import { useState } from 'react'
import { useLiveQuery } from '@electric-sql/pglite-react'
import { Plus, Target } from 'lucide-react'
import { useProject } from '@/hooks/useProject'
import { createEpic, createMilestone } from '@/db/queries/epics'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { fmtDate } from '@/lib/utils/dates'
import type { EpicWithProgress, MilestoneWithHealth } from '@/types/domain'

const EPIC_COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#14b8a6', '#f59e0b', '#10b981']

function EpicCard({ epic }: { epic: EpicWithProgress }) {
  const pct = epic.completionPct ?? 0
  return (
    <div className="bg-[#141416] border border-white/[0.07] rounded-xl p-4 hover:border-white/[0.14] hover:bg-[#1a1a1e] transition-all">
      <div className="flex items-start gap-3 mb-3">
        <div className="w-2.5 h-2.5 rounded-full mt-1 shrink-0" style={{ backgroundColor: epic.color ?? '#7c3aed' }} />
        <div className="flex-1 min-w-0">
          <h3 className="text-[13px] font-medium text-white truncate">{epic.title}</h3>
          {epic.description && <p className="text-[12px] text-white/40 mt-0.5 line-clamp-2">{epic.description}</p>}
        </div>
        <span className="text-[12px] text-white/30 shrink-0">{pct}%</span>
      </div>
      <div className="h-1 bg-white/[0.07] rounded-full overflow-hidden mb-2">
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: epic.color ?? '#7c3aed' }} />
      </div>
      <div className="flex items-center justify-between text-[11px] text-white/30">
        <span>{epic.doneItems}/{epic.totalItems} items · {epic.donePoints}/{epic.totalPoints} pts</span>
        {epic.target_date && <span>Due {fmtDate(epic.target_date)}</span>}
      </div>
    </div>
  )
}

function MilestoneRow({ ms }: { ms: MilestoneWithHealth }) {
  const healthColor = ms.health === 'green' ? 'text-emerald-400' : ms.health === 'amber' ? 'text-amber-400' : 'text-red-400'
  return (
    <div className="flex items-center gap-4 px-4 py-2.5 border-b border-white/[0.05] last:border-0 hover:bg-white/[0.02] transition-colors">
      <Target size={13} className={healthColor} strokeWidth={1.8} />
      <span className="flex-1 text-[13px] text-white/75">{ms.title}</span>
      <span className="text-[12px] text-white/30">{ms.doneItems}/{ms.linkedItems} items</span>
      <span className="text-[12px] text-white/30">{fmtDate(ms.target_date)}</span>
      <span className={`text-[11px] font-medium capitalize ${healthColor}`}>{ms.health}</span>
    </div>
  )
}

export default function Epics() {
  const { projectId } = useProject()
  const [tab, setTab] = useState<'epics' | 'milestones'>('epics')
  const [showEpicForm, setShowEpicForm] = useState(false)
  const [showMsForm, setShowMsForm] = useState(false)
  const [epicTitle, setEpicTitle] = useState('')
  const [epicColor, setEpicColor] = useState(EPIC_COLORS[0])
  const [msTitle, setMsTitle] = useState('')
  const [msDate, setMsDate] = useState('')

  const epicsResult = useLiveQuery<EpicWithProgress>(
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
     GROUP BY e.id ORDER BY e.created_at DESC`,
    [projectId ?? ''],
  )
  const epics = epicsResult?.rows ?? []

  const msResult = useLiveQuery(
    `SELECT m.*,
      COUNT(wi.id)::int as "linkedItems",
      COUNT(wi.id) FILTER (WHERE cs.is_done = TRUE)::int as "doneItems"
     FROM milestones m
     LEFT JOIN work_items wi ON wi.milestone_id = m.id
     LEFT JOIN custom_stages cs ON cs.id = wi.stage_id
     WHERE m.project_id = $1 GROUP BY m.id ORDER BY m.target_date NULLS LAST`,
    [projectId ?? ''],
  )
  const milestones = (msResult?.rows ?? []) as unknown as MilestoneWithHealth[]

  async function handleCreateEpic() {
    if (!epicTitle.trim() || !projectId) return
    await createEpic({ projectId, title: epicTitle.trim(), color: epicColor })
    setEpicTitle(''); setShowEpicForm(false)
  }

  async function handleCreateMs() {
    if (!msTitle.trim() || !projectId) return
    await createMilestone({ projectId, title: msTitle.trim(), targetDate: msDate || undefined })
    setMsTitle(''); setMsDate(''); setShowMsForm(false)
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="shrink-0 px-6 pt-5 pb-4 border-b border-white/[0.05]">
        <div className="flex items-center justify-between">
          {/* Tab switcher */}
          <div className="flex gap-px bg-white/[0.05] rounded-lg p-0.5">
            {(['epics', 'milestones'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-3 py-1.5 rounded-md text-[13px] font-medium transition-all capitalize ${
                  tab === t ? 'bg-white/[0.09] text-white' : 'text-white/35 hover:text-white/70'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
          <Button size="sm" onClick={() => tab === 'epics' ? setShowEpicForm(true) : setShowMsForm(true)} className="gap-1.5">
            <Plus size={12} strokeWidth={2.5} />
            New {tab === 'epics' ? 'Epic' : 'Milestone'}
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-auto px-6 py-5">
        {tab === 'epics' && (
          <>
            {showEpicForm && (
              <div className="bg-[#141416] border border-white/[0.07] rounded-xl p-4 mb-5 space-y-3">
                <Input autoFocus value={epicTitle} onChange={(e) => setEpicTitle(e.target.value)} placeholder="Epic title" />
                <div className="flex gap-2">
                  {EPIC_COLORS.map((c) => (
                    <button
                      key={c}
                      onClick={() => setEpicColor(c)}
                      className="w-5 h-5 rounded-full transition-transform hover:scale-110"
                      style={{ backgroundColor: c, outline: epicColor === c ? '2px solid white' : 'none', outlineOffset: '2px' }}
                    />
                  ))}
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleCreateEpic}>Create</Button>
                  <Button variant="ghost" size="sm" onClick={() => setShowEpicForm(false)}>Cancel</Button>
                </div>
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
              {epics.length === 0
                ? <div className="col-span-3 text-center py-16 text-[13px] text-white/25">No epics yet</div>
                : epics.map((epic) => <EpicCard key={epic.id} epic={epic} />)}
            </div>
          </>
        )}

        {tab === 'milestones' && (
          <>
            {showMsForm && (
              <div className="bg-[#141416] border border-white/[0.07] rounded-xl p-4 mb-5 space-y-3">
                <Input autoFocus value={msTitle} onChange={(e) => setMsTitle(e.target.value)} placeholder="Milestone title" />
                <Input type="date" value={msDate} onChange={(e) => setMsDate(e.target.value)} />
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleCreateMs}>Create</Button>
                  <Button variant="ghost" size="sm" onClick={() => setShowMsForm(false)}>Cancel</Button>
                </div>
              </div>
            )}
            <div className="bg-[#141416] border border-white/[0.07] rounded-xl overflow-hidden">
              {milestones.length === 0
                ? <p className="px-4 py-16 text-[13px] text-white/25 text-center">No milestones yet</p>
                : milestones.map((ms) => <MilestoneRow key={ms.id} ms={ms} />)}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
