import { useState, useEffect } from 'react'
import { useLiveQuery } from '@electric-sql/pglite-react'
import * as LucideIcons from 'lucide-react'
import type { LucideProps } from 'lucide-react'
import { Trash2, Plus, GripVertical, Check, ChevronDown, UserCircle2, Ban } from 'lucide-react'
import { useProject } from '@/hooks/useProject'
import { createStage, updateStage, deleteStage, createLabel, deleteLabel, updateProject, isProjectKeyTaken } from '@/db/queries/projects'
import { createUser, addProjectMember, removeProjectMember } from '@/db/queries/users'
import type { DbCustomStage, DbLabel, DbUser } from '@/types/db'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { cn } from '@/lib/utils/cn'
import { ProjectAvatar, PROJECT_ICONS } from '@/components/ProjectAvatar'

const COLORS = [
  { hex: '#7c3aed', name: 'Violet' },
  { hex: '#6366f1', name: 'Indigo' },
  { hex: '#3b82f6', name: 'Blue' },
  { hex: '#14b8a6', name: 'Teal' },
  { hex: '#10b981', name: 'Green' },
  { hex: '#f59e0b', name: 'Amber' },
  { hex: '#ef4444', name: 'Red' },
  { hex: '#ec4899', name: 'Pink' },
  { hex: '#94a3b8', name: 'Slate' },
]

function ColorPicker({ value, onChange }: { value: string; onChange: (c: string) => void }) {
  const [open, setOpen] = useState(false)
  const selected = COLORS.find(c => c.hex === value) ?? COLORS[0]

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="h-[30px] flex items-center gap-2 px-2.5 rounded-md bg-white/[0.04] border border-white/[0.09] hover:bg-white/[0.07] transition-all"
      >
        <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: selected.hex }} />
        <span className="text-[11px] text-white/60">{selected.name}</span>
        <ChevronDown size={11} className="text-white/30" />
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-1 z-50 bg-[#1c1c20] border border-white/[0.1] rounded-xl shadow-2xl shadow-black/60 p-2 grid grid-cols-3 gap-1 w-[148px] animate-fade-in">
          {COLORS.map(c => (
            <button
              key={c.hex}
              type="button"
              onClick={() => { onChange(c.hex); setOpen(false) }}
              className={cn(
                'flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-[11px] transition-all',
                value === c.hex ? 'bg-white/[0.1] text-white' : 'text-white/50 hover:bg-white/[0.06] hover:text-white/80',
              )}
            >
              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: c.hex }} />
              {c.name}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function IconPicker({ value, color, onChange }: { value: string | null; color: string; onChange: (i: string | null) => void }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="h-[30px] flex items-center gap-1.5 px-2.5 rounded-md bg-white/[0.04] border border-white/[0.09] hover:bg-white/[0.07] transition-all"
      >
        <ProjectAvatar color={color} icon={value} size="xs" />
        <span className="text-[11px] text-white/60">Icon</span>
        <ChevronDown size={11} className="text-white/30" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute top-full left-0 mt-1 z-50 w-52 animate-fade-in shadow-2xl shadow-black/60 rounded-lg border border-white/[0.08] overflow-hidden bg-[#111113]">
            <div className="p-1.5 max-h-52 overflow-y-auto space-y-1.5">
              <button
                onClick={() => { onChange(null); setOpen(false) }}
                className={cn(
                  'flex items-center gap-1 px-1 py-0.5 rounded text-[9px] transition-colors',
                  !value ? 'bg-white/[0.08] text-white' : 'text-white/25 hover:text-white/55 hover:bg-white/[0.04]',
                )}
              >
                <Ban size={8} strokeWidth={1.5} /> None
              </button>
              {Object.entries(PROJECT_ICONS).map(([category, names]) => (
                <div key={category}>
                  <p className="text-[7px] font-semibold text-white/20 uppercase tracking-widest mb-0.5">{category}</p>
                  <div className="grid grid-cols-10 gap-0.5">
                    {names.map(name => {
                      const Icon = (LucideIcons as unknown as Record<string, React.ComponentType<LucideProps>>)[name]
                      if (!Icon) return null
                      return (
                        <button
                          key={name}
                          onClick={() => { onChange(name); setOpen(false) }}
                          title={name}
                          className={cn(
                            'w-4 h-4 rounded flex items-center justify-center transition-all hover:scale-110',
                            value === name ? 'bg-white/[0.14] text-white' : 'text-white/35 hover:text-white/80 hover:bg-white/[0.06]',
                          )}
                        >
                          <Icon size={10} strokeWidth={1.6} />
                        </button>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

function Section({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="bg-[#141416] border border-white/[0.07] rounded-xl overflow-hidden">
      <div className="px-5 py-3 border-b border-white/[0.06] bg-white/[0.02] flex items-baseline gap-3">
        <span className="text-[11px] font-semibold text-white/50 uppercase tracking-widest">{title}</span>
        {description && <span className="text-[11px] text-white/20">{description}</span>}
      </div>
      <div className="p-5">{children}</div>
    </div>
  )
}

export default function Settings() {
  const { project, projectId } = useProject()
  const [newStageName, setNewStageName] = useState('')
  const [newStageColor, setNewStageColor] = useState(COLORS[0].hex)
  const [newLabelName, setNewLabelName] = useState('')
  const [newLabelColor, setNewLabelColor] = useState(COLORS[0].hex)
  const [newMemberName, setNewMemberName] = useState('')
  const [newMemberEmail, setNewMemberEmail] = useState('')
  const [projectName, setProjectName] = useState(project?.name ?? '')
  const [projectDesc, setProjectDesc] = useState(project?.description ?? '')
  const [projectKey, setProjectKey] = useState(project?.key ?? '')
  const [projectColor, setProjectColor] = useState(project?.color ?? '#7c3aed')
  const [projectIcon, setProjectIcon] = useState<string | null>(project?.icon ?? null)
  const [nameSaved, setNameSaved] = useState(false)
  const [keyError, setKeyError] = useState<string | null>(null)

  useEffect(() => {
    if (project?.name && !projectName) setProjectName(project.name)
    if (project?.description !== undefined && !projectDesc) setProjectDesc(project.description ?? '')
    if (project?.key && !projectKey) setProjectKey(project.key)
    if (project?.color && !projectColor) setProjectColor(project.color)
    if (project?.icon !== undefined && !projectIcon) setProjectIcon(project.icon ?? null)
  }, [project?.name, project?.description, project?.key, project?.color, project?.icon])

  const stages = useLiveQuery<DbCustomStage>(
    `SELECT * FROM custom_stages WHERE project_id = $1 ORDER BY position`,
    [projectId ?? ''],
  )?.rows ?? []

  const labels = useLiveQuery<DbLabel>(
    `SELECT * FROM labels WHERE project_id = $1 ORDER BY name`,
    [projectId ?? ''],
  )?.rows ?? []

  const members = useLiveQuery<DbUser>(
    `SELECT u.* FROM users u JOIN project_members pm ON pm.user_id = u.id WHERE pm.project_id = $1 ORDER BY u.name`,
    [projectId ?? ''],
  )?.rows ?? []

  async function handleAddStage() {
    if (!newStageName.trim() || !projectId) return
    await createStage(projectId, newStageName.trim(), newStageColor)
    setNewStageName('')
  }

  async function handleDeleteStage(id: string) {
    if (!confirm('Delete this stage? Items in it will lose their stage.')) return
    await deleteStage(id)
  }

  async function handleAddLabel() {
    if (!newLabelName.trim() || !projectId) return
    await createLabel(projectId, newLabelName.trim(), newLabelColor)
    setNewLabelName('')
  }

  async function handleSaveProject() {
    if (!projectName.trim() || !projectId) return
    setKeyError(null)
    const cleanKey = projectKey.trim().toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 24)
    if (!cleanKey) { setKeyError('Key cannot be empty'); return }
    if (cleanKey !== project?.key) {
      const taken = await isProjectKeyTaken(cleanKey, projectId)
      if (taken) { setKeyError(`"${cleanKey}" is already used by another project`); return }
    }
    await updateProject(projectId, { name: projectName.trim(), description: projectDesc.trim(), color: projectColor, icon: projectIcon ?? undefined, key: cleanKey })
    setProjectKey(cleanKey)
    setNameSaved(true)
    setTimeout(() => setNameSaved(false), 2000)
  }

  async function handleAddMember() {
    if (!newMemberName.trim() || !newMemberEmail.trim() || !projectId) return
    const user = await createUser({ name: newMemberName.trim(), email: newMemberEmail.trim().toLowerCase() })
    await addProjectMember(projectId, user.id)
    setNewMemberName('')
    setNewMemberEmail('')
  }

  async function handleRemoveMember(userId: string) {
    if (!projectId) return
    await removeProjectMember(projectId, userId)
  }

  if (!project) return <div className="p-8 text-white/30 text-[13px]">Loading…</div>

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="shrink-0 px-6 pt-5 pb-4 border-b border-white/[0.05]">
        <h1 className="font-display text-[15px] font-bold text-white tracking-tight">Settings</h1>
        <p className="text-[11px] text-white/35 mt-0.5">{project.name} · {project.key}</p>
      </div>

      <div className="flex-1 overflow-auto px-6 py-5 space-y-4">

        {/* Project identity */}
        <Section title="Project">
          <div className="space-y-2">
            {/* Name row with icon + color dropdowns */}
            <div className="flex items-center gap-2">
              <label className="text-[10px] font-medium text-white/30 uppercase tracking-wider w-24 shrink-0">Name</label>
              <Input
                value={projectName}
                onChange={e => setProjectName(e.target.value)}
                placeholder="Project name"
                className="flex-1"
                onKeyDown={e => e.key === 'Enter' && handleSaveProject()}
              />
              <IconPicker value={projectIcon} color={projectColor} onChange={setProjectIcon} />
              <ColorPicker value={projectColor} onChange={setProjectColor} />
              <Button size="sm" onClick={handleSaveProject} className="gap-1 shrink-0">
                {nameSaved ? <Check size={11} /> : null}
                {nameSaved ? 'Saved' : 'Save'}
              </Button>
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <label className="text-[10px] font-medium text-white/30 uppercase tracking-wider w-24 shrink-0">Project ID</label>
                <Input
                  value={projectKey}
                  onChange={e => { setProjectKey(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 24)); setKeyError(null) }}
                  placeholder={project.key}
                  className="flex-1 font-mono text-xs"
                  onKeyDown={e => e.key === 'Enter' && handleSaveProject()}
                />
              </div>
              {keyError && <p className="text-[11px] text-red-400 pl-[calc(6rem+0.5rem)]">{keyError}</p>}
              <p className="text-[10px] text-white/20 pl-[calc(6rem+0.5rem)]">Letters and numbers only · max 24 chars · must be unique</p>
            </div>
            <textarea
              value={projectDesc}
              onChange={e => setProjectDesc(e.target.value)}
              placeholder="Description — help your team know what this project is about"
              rows={6}
              className="w-full bg-white/[0.04] border border-white/[0.09] rounded-md px-3 py-1.5 text-xs text-white focus:outline-none focus:border-violet-500/60 focus:bg-white/[0.06] placeholder:text-white/25 transition-all resize-none"
            />
          </div>
        </Section>

        {/* Board Stages */}
        <Section title="Board Stages" description="workflow columns">
          {/* Existing stages */}
          <div className="space-y-px mb-4">
            {stages.length === 0 && (
              <p className="text-[12px] text-white/20 py-4 text-center">No stages yet — add one below</p>
            )}
            {stages.map(stage => (
              <div key={stage.id} className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white/[0.03] group transition-colors">
                <GripVertical size={13} className="text-white/10 cursor-grab shrink-0" />
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: stage.color ?? '#7c3aed' }} />
                <span className="flex-1 text-[13px] text-white/80 truncate">{stage.name}</span>
                <button
                  onClick={() => updateStage(stage.id, { is_done: !stage.is_done })}
                  className={cn(
                    'text-[11px] px-2 py-0.5 rounded-md border transition-all shrink-0',
                    stage.is_done
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                      : 'text-white/25 border-white/[0.08] hover:text-white/60 hover:border-white/20',
                  )}
                >
                  {stage.is_done ? '✓ Done' : 'Mark done'}
                </button>
                <button
                  onClick={() => handleDeleteStage(stage.id)}
                  className="w-6 h-6 flex items-center justify-center rounded text-white/15 hover:text-red-400 hover:bg-red-500/[0.08] opacity-0 group-hover:opacity-100 transition-all shrink-0"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            ))}
          </div>

          {/* Add stage row */}
          <div className="flex gap-2 items-center pt-3 border-t border-white/[0.05]">
            <Input
              value={newStageName}
              onChange={e => setNewStageName(e.target.value)}
              placeholder="New stage name…"
              className="flex-1"
              onKeyDown={e => e.key === 'Enter' && handleAddStage()}
            />
            <ColorPicker value={newStageColor} onChange={setNewStageColor} />
            <Button size="sm" onClick={handleAddStage} className="gap-1 shrink-0">
              <Plus size={11} strokeWidth={2.5} />Add
            </Button>
          </div>
        </Section>

        {/* Labels */}
        <Section title="Labels" description="tag work items">
          {labels.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-4">
              {labels.map(label => (
                <span
                  key={label.id}
                  className="inline-flex items-center gap-1.5 pl-2.5 pr-1.5 py-1 rounded-full text-[11px] font-medium"
                  style={{ backgroundColor: `${label.color}18`, color: label.color, border: `1px solid ${label.color}30` }}
                >
                  {label.name}
                  <button
                    onClick={() => deleteLabel(label.id)}
                    className="w-3.5 h-3.5 flex items-center justify-center rounded-full hover:bg-black/20 transition-colors text-current opacity-60 hover:opacity-100"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}

          <div className="flex gap-2 items-center pt-3 border-t border-white/[0.05]">
            <Input
              value={newLabelName}
              onChange={e => setNewLabelName(e.target.value)}
              placeholder="New label name…"
              className="flex-1"
              onKeyDown={e => e.key === 'Enter' && handleAddLabel()}
            />
            <ColorPicker value={newLabelColor} onChange={setNewLabelColor} />
            <Button size="sm" onClick={handleAddLabel} className="gap-1 shrink-0">
              <Plus size={11} strokeWidth={2.5} />Add
            </Button>
          </div>
        </Section>

        {/* Team / Teammates */}
        <Section title="Team" description="project members">
          <div className="space-y-px mb-4">
            {members.length === 0 && (
              <p className="text-[12px] text-white/20 py-4 text-center">No members yet — add teammates below</p>
            )}
            {members.map(member => (
              <div key={member.id} className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white/[0.03] group transition-colors">
                <div className="w-6 h-6 rounded-full bg-violet-500/20 flex items-center justify-center shrink-0">
                  <UserCircle2 size={14} className="text-violet-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] text-white/80 truncate">{member.name}</p>
                  <p className="text-[11px] text-white/30 truncate">{member.email}</p>
                </div>
                <span className={cn(
                  'text-[10px] px-2 py-0.5 rounded-md border shrink-0',
                  member.role === 'admin'
                    ? 'bg-violet-500/10 text-violet-400 border-violet-500/20'
                    : 'text-white/25 border-white/[0.08]',
                )}>
                  {member.role}
                </span>
                <button
                  onClick={() => handleRemoveMember(member.id)}
                  className="w-6 h-6 flex items-center justify-center rounded text-white/15 hover:text-red-400 hover:bg-red-500/[0.08] opacity-0 group-hover:opacity-100 transition-all shrink-0"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            ))}
          </div>

          <div className="flex gap-2 items-center pt-3 border-t border-white/[0.05]">
            <Input
              value={newMemberName}
              onChange={e => setNewMemberName(e.target.value)}
              placeholder="Name…"
              className="flex-1"
              onKeyDown={e => e.key === 'Enter' && handleAddMember()}
            />
            <Input
              value={newMemberEmail}
              onChange={e => setNewMemberEmail(e.target.value)}
              placeholder="Email…"
              className="flex-1"
              onKeyDown={e => e.key === 'Enter' && handleAddMember()}
            />
            <Button size="sm" onClick={handleAddMember} className="gap-1 shrink-0">
              <Plus size={11} strokeWidth={2.5} />Add
            </Button>
          </div>
        </Section>
      </div>
    </div>
  )
}
