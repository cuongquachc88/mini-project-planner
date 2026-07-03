import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useLiveQuery } from '@electric-sql/pglite-react'
import {
  Plus, FolderOpen, Archive, ArrowUpRight,
  Zap, CheckCircle2, Circle, AlertCircle,
  User, TrendingUp, Box,
} from 'lucide-react'
import type { DbProject } from '@/types/db'
import { createProject } from '@/db/queries/projects'
import { getAppMeta, getUserById } from '@/db/queries/users'
import { useStore } from '@/store'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { cn } from '@/lib/utils/cn'

const COLORS = ['#7c3aed','#2563eb','#0891b2','#059669','#d97706','#dc2626','#db2777','#7c3aed']

/* ── New Project Modal ─────────────────────────────── */
function NewProjectModal({ onClose, onCreated }: { onClose: () => void; onCreated: (id: string) => void }) {
  const { currentUser } = useStore()
  const [name, setName] = useState('')
  const [key, setKey] = useState('')
  const [color, setColor] = useState(COLORS[0])
  const [desc, setDesc] = useState('')
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState('')

  function onName(n: string) {
    setName(n)
    if (!key || key === name.toUpperCase().replace(/[^A-Z]/g,'').slice(0,4))
      setKey(n.toUpperCase().replace(/[^A-Z]/g,'').slice(0,4))
  }

  async function submit() {
    if (!name.trim() || !key.trim()) { setErr('Name and key required'); return }
    if (!currentUser) { setErr('Set up your profile first'); return }
    setLoading(true); setErr('')
    try {
      const p = await createProject({ name: name.trim(), key: key.trim(), description: desc, color, ownerId: currentUser.id })
      onCreated(p.id)
    } catch(e) { setErr(String(e)) }
    finally { setLoading(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
      <div className="w-full max-w-md rounded-2xl border border-white/[0.08] shadow-2xl shadow-black/60 overflow-hidden animate-fade-in" style={{ background: '#111113' }}>
        <div className="px-6 pt-6 pb-4 border-b border-white/[0.06]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg shrink-0" style={{ backgroundColor: color }} />
            <h2 className="text-[15px] font-semibold text-white">New project</h2>
          </div>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-[11px] font-medium text-white/40 mb-1.5 uppercase tracking-wider">Name</label>
            <Input value={name} onChange={e => onName(e.target.value)} placeholder="My project" autoFocus />
          </div>
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="block text-[11px] font-medium text-white/40 mb-1.5 uppercase tracking-wider">Key</label>
              <Input value={key} onChange={e => setKey(e.target.value.toUpperCase().replace(/[^A-Z]/g,'').slice(0,6))} placeholder="PROJ" className="font-mono" />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-white/40 mb-1.5 uppercase tracking-wider">Color</label>
              <div className="flex gap-1.5 mt-0.5 flex-wrap w-[108px]">
                {COLORS.map(c => (
                  <button key={c} onClick={() => setColor(c)}
                    className="w-6 h-6 rounded-md transition-all hover:scale-110"
                    style={{ backgroundColor: c, outline: color === c ? `2px solid ${c}` : 'none', outlineOffset: 2 }}
                  />
                ))}
              </div>
            </div>
          </div>
          <div>
            <label className="block text-[11px] font-medium text-white/40 mb-1.5 uppercase tracking-wider">Description</label>
            <Input value={desc} onChange={e => setDesc(e.target.value)} placeholder="Optional" />
          </div>
          {err && <p className="text-red-400 text-xs">{err}</p>}
          <div className="flex gap-2 pt-1">
            <Button onClick={submit} disabled={loading} className="flex-1">{loading ? 'Creating…' : 'Create project'}</Button>
            <Button variant="ghost" onClick={onClose}>Cancel</Button>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ── Per-project stats row ─────────────────────────── */
interface ProjectStats { total: number; done: number; in_progress: number; active_sprint: string | null; overdue: number }

function useProjectStats(projectId: string) {
  const r = useLiveQuery<ProjectStats>(
    `SELECT
       COUNT(wi.id)::int                                                   AS total,
       COUNT(wi.id) FILTER (WHERE cs.is_done = TRUE)::int                  AS done,
       COUNT(wi.id) FILTER (WHERE cs.is_done = FALSE AND wi.stage_id IS NOT NULL)::int AS in_progress,
       COUNT(wi.id) FILTER (WHERE wi.due_date IS NOT NULL AND wi.due_date < CURRENT_DATE AND cs.is_done IS NOT TRUE)::int AS overdue,
       (SELECT name FROM sprints WHERE project_id = $1 AND status = 'active' LIMIT 1) AS active_sprint
     FROM work_items wi
     LEFT JOIN custom_stages cs ON cs.id = wi.stage_id
     WHERE wi.project_id = $1`,
    [projectId],
  )
  return r?.rows[0] ?? null
}

function ProjectRow({ project, onOpen }: { project: DbProject; onOpen: () => void }) {
  const stats = useProjectStats(project.id)
  const pct = stats && stats.total > 0 ? Math.round((stats.done / stats.total) * 100) : 0

  return (
    <div
      onClick={onOpen}
      className="group flex items-center gap-4 px-5 py-3.5 border-b border-white/[0.04] hover:bg-white/[0.025] transition-colors cursor-pointer last:border-0"
    >
      {/* Color + name */}
      <div className="flex items-center gap-3 w-56 shrink-0">
        <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: project.color ?? '#7c3aed' }} />
        <span className="text-[13px] font-medium text-white/80 group-hover:text-white transition-colors truncate">
          {project.name}
        </span>
        <span className="text-[10px] text-white/20 font-mono ml-auto shrink-0">{project.key}</span>
      </div>

      {/* Sprint badge */}
      <div className="w-32 shrink-0">
        {stats?.active_sprint
          ? <span className="inline-flex items-center gap-1.5 text-[11px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-2 py-0.5">
              <Zap size={9} className="fill-current" />{stats.active_sprint}
            </span>
          : <span className="text-[11px] text-white/20">—</span>
        }
      </div>

      {/* Stats */}
      <div className="flex items-center gap-6 flex-1 text-[12px]">
        <span className="flex items-center gap-1.5 text-white/40">
          <Circle size={11} className="text-white/20" />{stats?.total ?? 0} items
        </span>
        <span className="flex items-center gap-1.5 text-white/40">
          <CheckCircle2 size={11} className="text-emerald-500" />{stats?.done ?? 0} done
        </span>
        {(stats?.overdue ?? 0) > 0 && (
          <span className="flex items-center gap-1.5 text-red-400">
            <AlertCircle size={11} />{stats!.overdue} overdue
          </span>
        )}
      </div>

      {/* Progress */}
      <div className="w-32 shrink-0 flex items-center gap-2.5">
        <div className="flex-1 h-[3px] bg-white/[0.06] rounded-full overflow-hidden">
          <div className="h-full rounded-full transition-all duration-500"
            style={{ width: `${pct}%`, backgroundColor: project.color ?? '#7c3aed' }} />
        </div>
        <span className="text-[11px] text-white/30 w-7 text-right tabular-nums">{pct}%</span>
      </div>

      <ArrowUpRight size={13} className="text-white/15 group-hover:text-white/40 transition-colors shrink-0" />
    </div>
  )
}

/* ── Global stat pill ──────────────────────────────── */
function Stat({ label, value, sub, icon: Icon, accent }: {
  label: string; value: number | string; sub?: string
  icon: React.ElementType; accent: string
}) {
  return (
    <div className="flex flex-col gap-3 p-5 rounded-xl border border-white/[0.06] bg-white/[0.02]">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-medium text-white/35 uppercase tracking-widest">{label}</span>
        <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${accent}18` }}>
          <Icon size={14} style={{ color: accent }} strokeWidth={1.8} />
        </div>
      </div>
      <div>
        <p className="text-[28px] font-bold text-white leading-none tracking-tight">{value}</p>
        {sub && <p className="text-[11px] text-white/30 mt-1">{sub}</p>}
      </div>
    </div>
  )
}

/* ── Main Home page ────────────────────────────────── */
export default function Home() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { currentUser, setCurrentUser } = useStore()
  const [showNew, setShowNew] = useState(searchParams.get('new') === '1')
  const [showArchived, setShowArchived] = useState(false)

  const projectResult = useLiveQuery<DbProject>(`SELECT * FROM projects ORDER BY created_at DESC`)
  const all    = projectResult?.rows ?? []
  const active = all.filter(p => !p.archived)
  const archived = all.filter(p => p.archived)

  const gs = useLiveQuery<{
    total_items: number; done_items: number; in_progress: number
    active_sprints: number; overdue: number; total_points: number
  }>(
    `SELECT
       COUNT(wi.id)::int AS total_items,
       COUNT(wi.id) FILTER (WHERE cs.is_done = TRUE)::int AS done_items,
       COUNT(wi.id) FILTER (WHERE cs.is_done = FALSE AND wi.stage_id IS NOT NULL)::int AS in_progress,
       (SELECT COUNT(*)::int FROM sprints WHERE status = 'active') AS active_sprints,
       COUNT(wi.id) FILTER (WHERE wi.due_date < CURRENT_DATE AND cs.is_done IS NOT TRUE)::int AS overdue,
       COALESCE(SUM(wi.story_points) FILTER (WHERE cs.is_done = TRUE), 0)::int AS total_points
     FROM work_items wi
     LEFT JOIN custom_stages cs ON cs.id = wi.stage_id`,
    [],
  )?.rows[0]

  const globalPct = gs && gs.total_items > 0
    ? Math.round((gs.done_items / gs.total_items) * 100) : 0

  useEffect(() => {
    async function boot() {
      if (currentUser) return
      const uid = await getAppMeta('active_user_id')
      if (uid) {
        const u = await getUserById(uid)
        if (u) { setCurrentUser(u); return }
      }
      if (await getAppMeta('schema_version')) navigate('/login')
    }
    boot()
  }, [currentUser, navigate, setCurrentUser])

  const greeting = currentUser
    ? `Good ${new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening'}, ${currentUser.name.split(' ')[0]}`
    : 'Your workspace'

  return (
    <div className="min-h-screen bg-[#0d0d0f] text-white">

      {/* Top nav */}
      <header className="sticky top-0 z-20 border-b border-white/[0.06] bg-[#0d0d0f]/90 backdrop-blur-sm">
        <div className="max-w-5xl mx-auto px-6 h-12 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded-md bg-violet-600 flex items-center justify-center">
              <Box size={13} className="text-white" strokeWidth={2} />
            </div>
            <span className="text-[14px] font-semibold text-white tracking-tight">Planner</span>
          </div>
          <div className="flex items-center gap-1">
            <a href="/docs/" target="_blank" className="btn-ghost text-[12px]">Docs</a>
            <button onClick={() => navigate('/profile')} className="btn-ghost text-[12px] flex items-center gap-1.5">
              <User size={12} strokeWidth={1.8} />
              {currentUser?.name ?? 'Profile'}
            </button>
            <Button size="sm" onClick={() => setShowNew(true)} className="ml-2 gap-1.5">
              <Plus size={13} strokeWidth={2} />New
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-10">

        {/* Greeting */}
        <div className="mb-8">
          <h1 className="text-[22px] font-semibold text-white tracking-tight">{greeting}</h1>
          <p className="text-[13px] text-white/35 mt-1">
            {active.length === 0
              ? 'Create your first project to get started.'
              : `${active.length} project${active.length !== 1 ? 's' : ''} · ${gs?.total_items ?? 0} work items · local & offline`}
          </p>
        </div>

        {active.length > 0 && (
          <>
            {/* Stats row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
              <Stat label="Active Sprints"  value={gs?.active_sprints ?? 0} icon={Zap}          accent="#a78bfa" sub={`across ${active.length} projects`} />
              <Stat label="Total Items"     value={gs?.total_items ?? 0}    icon={Circle}        accent="#60a5fa" sub={`${gs?.in_progress ?? 0} in progress`} />
              <Stat label="Completed"       value={`${globalPct}%`}         icon={CheckCircle2}  accent="#34d399" sub={`${gs?.done_items ?? 0} items done`} />
              <Stat label="Points Shipped"  value={gs?.total_points ?? 0}   icon={TrendingUp}    accent="#fb923c"
                sub={(gs?.overdue ?? 0) > 0 ? `${gs!.overdue} overdue` : 'no overdue items'} />
            </div>

            {/* Projects table */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-[11px] font-semibold text-white/30 uppercase tracking-widest">Projects</h2>
                <button
                  onClick={() => setShowNew(true)}
                  className="flex items-center gap-1 text-[11px] text-violet-400 hover:text-violet-300 transition-colors"
                >
                  <Plus size={11} />New project
                </button>
              </div>

              {/* Table header */}
              <div className="flex items-center gap-4 px-5 py-2 text-[10px] font-medium text-white/25 uppercase tracking-wider border-b border-white/[0.05]">
                <span className="w-56 shrink-0">Project</span>
                <span className="w-32 shrink-0">Sprint</span>
                <span className="flex-1">Status</span>
                <span className="w-32 shrink-0">Progress</span>
                <span className="w-4 shrink-0" />
              </div>

              {/* Rows */}
              <div className="rounded-xl border border-white/[0.06] overflow-hidden bg-[#0f0f11] mb-4">
                {active.map(p => (
                  <ProjectRow
                    key={p.id}
                    project={p}
                    onOpen={() => navigate(`/projects/${p.id}/board`)}
                  />
                ))}
              </div>

              {/* Archived toggle */}
              {archived.length > 0 && (
                <div>
                  <button
                    onClick={() => setShowArchived(v => !v)}
                    className="flex items-center gap-1.5 text-[11px] text-white/25 hover:text-white/50 transition-colors mb-3"
                  >
                    <Archive size={11} />
                    {showArchived ? 'Hide' : 'Show'} archived ({archived.length})
                  </button>
                  {showArchived && (
                    <div className="rounded-xl border border-white/[0.04] overflow-hidden opacity-40">
                      {archived.map(p => (
                        <ProjectRow key={p.id} project={p} onOpen={() => navigate(`/projects/${p.id}/board`)} />
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </>
        )}

        {/* Empty state */}
        {active.length === 0 && (
          <div className="flex flex-col items-center py-28 text-center">
            <div className="w-14 h-14 rounded-2xl border border-white/[0.06] bg-white/[0.02] flex items-center justify-center mb-5">
              <FolderOpen size={26} className="text-white/20" strokeWidth={1.5} />
            </div>
            <h2 className="text-[15px] font-semibold text-white/70 mb-2">No projects yet</h2>
            <p className="text-[13px] text-white/30 mb-7 max-w-xs leading-relaxed">
              Create a project to start managing work with boards, sprints, and epics.
            </p>
            <Button onClick={() => setShowNew(true)} className="gap-2">
              <Plus size={14} />Create project
            </Button>
          </div>
        )}

        {/* Footer */}
        <div className="mt-10 pt-5 border-t border-white/[0.05] flex items-center gap-5">
          <button onClick={() => navigate('/profile')} className="text-[11px] text-white/20 hover:text-white/45 transition-colors">
            Profile & Settings
          </button>
          <a href="/docs/sad.html" target="_blank" className="text-[11px] text-white/20 hover:text-white/45 transition-colors">
            Architecture
          </a>
          <span className="ml-auto text-[11px] text-white/15">Local · Offline-first · No server</span>
        </div>
      </main>

      {showNew && (
        <NewProjectModal
          onClose={() => setShowNew(false)}
          onCreated={id => { setShowNew(false); navigate(`/projects/${id}/board`) }}
        />
      )}
    </div>
  )
}
