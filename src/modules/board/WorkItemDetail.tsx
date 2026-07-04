import { useState, useEffect, useCallback, useRef } from 'react'
import {
  X, Trash2, Send, Calendar, User, Share2,
  Tag, Layers, AlertCircle, Hash, Link2, BookOpen, Plus,
  CheckSquare, Square, Paperclip, Download, FileText, XCircle,
} from 'lucide-react'
import { exportTaskCard } from '@/lib/htmlExport/exporter'
import { useLiveQuery } from '@electric-sql/pglite-react'
import type { DbWorkItem, DbCustomStage, DbLabel, DbUser, WorkItemType, Priority, DbEpic } from '@/types/db'
import {
  updateWorkItem, deleteWorkItem, getComments, addComment,
  getItemLabels, setItemLabels, getSubtasks, createWorkItem,
  getAttachments, addAttachment, deleteAttachment, getAttachmentData,
} from '@/db/queries/workItems'
import { useStore } from '@/store'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { cn } from '@/lib/utils/cn'

const TYPES: WorkItemType[] = ['story', 'bug', 'spike', 'task', 'action', 'request']
const PRIORITIES: Priority[] = ['critical', 'high', 'medium', 'low']

const TYPE_COLOR: Record<WorkItemType, string> = {
  story:   'text-violet-400 bg-violet-500/10',
  bug:     'text-red-400 bg-red-500/10',
  spike:   'text-amber-400 bg-amber-500/10',
  task:    'text-blue-400 bg-blue-500/10',
  action:  'text-emerald-400 bg-emerald-500/10',
  request: 'text-sky-400 bg-sky-500/10',
}

const PRIORITY_COLOR: Record<Priority, string> = {
  critical: 'text-red-400',
  high:     'text-orange-400',
  medium:   'text-yellow-400',
  low:      'text-white/30',
}

type Tab = 'detail' | 'ac' | 'tech' | 'comments' | 'files'

interface CommentRow { id: string; body: string; created_at: string; author_name: string | null }
interface AttachmentMeta { id: string; work_item_id: string; filename: string; mime_type: string; size_bytes: number; created_at: string }

interface Props {
  item: DbWorkItem
  projectId: string
  onClose: () => void
  onDeleted: () => void
}

export function WorkItemDetail({ item, projectId, onClose, onDeleted }: Props) {
  const { currentUser } = useStore()
  const [tab, setTab] = useState<Tab>('detail')
  const [editTitle, setEditTitle]   = useState(item.title)
  const [editDesc, setEditDesc]     = useState(item.description ?? '')
  const [editAC, setEditAC]         = useState(item.acceptance_criteria ?? '')
  const [editTech, setEditTech]     = useState(item.tech_notes ?? '')
  const [saving, setSaving]         = useState(false)
  const [commentBody, setCommentBody] = useState('')
  const [comments, setComments]     = useState<CommentRow[]>([])
  const [selectedLabels, setSelectedLabels] = useState<string[]>([])
  const [subtasks, setSubtasks]     = useState<DbWorkItem[]>([])
  const [newSubtask, setNewSubtask] = useState('')
  const [attachments, setAttachments] = useState<AttachmentMeta[]>([])
  const [attachErr, setAttachErr]   = useState('')
  const [confirmDelete, setConfirmDelete] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const stages = useLiveQuery<DbCustomStage>(
    `SELECT * FROM custom_stages WHERE project_id = $1 ORDER BY position`, [projectId],
  )?.rows ?? []

  const users = useLiveQuery<DbUser>(`SELECT * FROM users ORDER BY name`, [])?.rows ?? []

  const labels = useLiveQuery<DbLabel>(
    `SELECT * FROM labels WHERE project_id = $1 ORDER BY name`, [projectId],
  )?.rows ?? []

  const epics = useLiveQuery<DbEpic>(
    `SELECT * FROM epics WHERE project_id = $1 ORDER BY title`, [projectId],
  )?.rows ?? []

  const wikiPages = useLiveQuery<{ id: string; title: string }>(
    `SELECT id, title FROM wiki_pages WHERE project_id = $1 ORDER BY title`, [projectId],
  )?.rows ?? []

  const parentCandidates = useLiveQuery<{ id: string; title: string; type: WorkItemType }>(
    `SELECT id, title, type FROM work_items WHERE project_id = $1 AND id != $2 AND parent_id IS NULL ORDER BY title LIMIT 100`,
    [projectId, item.id],
  )?.rows ?? []

  const loadComments = useCallback(async () => {
    const rows = await getComments(item.id)
    setComments(rows as CommentRow[])
  }, [item.id])

  const loadSubtasks = useCallback(async () => {
    setSubtasks(await getSubtasks(item.id))
  }, [item.id])

  const loadAttachments = useCallback(async () => {
    setAttachments(await getAttachments(item.id) as AttachmentMeta[])
  }, [item.id])

  useEffect(() => {
    loadComments()
    loadSubtasks()
    loadAttachments()
    getItemLabels(item.id).then(setSelectedLabels)
  }, [item.id, loadComments, loadSubtasks, loadAttachments])

  async function saveField(field: Partial<DbWorkItem>) {
    setSaving(true)
    await updateWorkItem(item.id, field)
    setSaving(false)
  }

  async function handleLabelToggle(labelId: string) {
    const next = selectedLabels.includes(labelId)
      ? selectedLabels.filter(l => l !== labelId)
      : [...selectedLabels, labelId]
    setSelectedLabels(next)
    await setItemLabels(item.id, next)
  }

  async function handleAddSubtask() {
    if (!newSubtask.trim()) return
    await createWorkItem({ projectId, title: newSubtask.trim(), type: 'task', parentId: item.id })
    setNewSubtask('')
    loadSubtasks()
  }

  async function toggleSubtaskDone(sub: DbWorkItem) {
    const doneStage = stages.find(s => s.is_done)
    if (!doneStage) return
    await updateWorkItem(sub.id, { stage_id: sub.stage_id === doneStage.id ? null : doneStage.id })
    loadSubtasks()
  }

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setAttachErr('')
    if (file.size > 5 * 1024 * 1024) { setAttachErr('File too large — max 5 MB'); return }
    const reader = new FileReader()
    reader.onload = async () => {
      const base64 = (reader.result as string).split(',')[1]
      await addAttachment(item.id, file.name, file.type, base64)
      loadAttachments()
    }
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  async function handleDownload(att: AttachmentMeta) {
    const data = await getAttachmentData(att.id)
    if (!data) return
    const url = `data:${att.mime_type};base64,${data}`
    const a = document.createElement('a')
    a.href = url; a.download = att.filename; a.click()
  }

  async function handleDeleteAttachment(id: string) {
    await deleteAttachment(id)
    loadAttachments()
  }

  async function handleComment() {
    if (!commentBody.trim() || !currentUser) return
    await addComment(item.id, currentUser.id, commentBody.trim())
    setCommentBody('')
    loadComments()
  }

  async function handleDelete() {
    await deleteWorkItem(item.id)
    onDeleted(); onClose()
  }

  const doneStageId = stages.find(s => s.is_done)?.id

  const TABS: { id: Tab; label: string; badge?: number }[] = [
    { id: 'detail',   label: 'Detail' },
    { id: 'ac',       label: 'Criteria' },
    { id: 'tech',     label: 'Tech Notes' },
    { id: 'comments', label: 'Comments', badge: comments.length || undefined },
    { id: 'files',    label: 'Files', badge: attachments.length || undefined },
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-end bg-black/60 backdrop-blur-[2px]" onClick={onClose}>
      <div
        className="h-full w-full max-w-3xl flex flex-col border-l border-white/[0.07] overflow-hidden"
        style={{ background: '#111113' }}
        onClick={e => e.stopPropagation()}
      >
        {/* ── Header ── */}
        <div className="shrink-0 flex items-center gap-2.5 px-4 py-2.5 border-b border-white/[0.06] bg-[#0f0f11]">
          <span className={cn('text-[10px] font-semibold px-1.5 py-0.5 rounded uppercase tracking-wide', TYPE_COLOR[item.type])}>
            {item.type}
          </span>
          <span className="text-[10px] text-white/20 font-mono">{item.id.slice(0, 8)}</span>
          {saving && <span className="text-[10px] text-white/25 ml-1">saving…</span>}
          <div className="ml-auto flex items-center gap-0.5">
            <button onClick={() => exportTaskCard(item)} className="flex items-center gap-1 text-[10px] text-white/30 hover:text-white/60 px-2 py-1 rounded hover:bg-white/[0.04] transition-colors">
              <Share2 size={10} />Export
            </button>
            <button onClick={() => setConfirmDelete(true)} className="flex items-center gap-1 text-[10px] text-white/30 hover:text-red-400 px-2 py-1 rounded hover:bg-red-500/[0.06] transition-colors">
              <Trash2 size={10} />Delete
            </button>
            <button onClick={onClose} className="ml-1 text-white/25 hover:text-white/70 transition-colors p-1 rounded hover:bg-white/[0.04]">
              <X size={14} />
            </button>
          </div>
        </div>

        {/* ── Body: main + sidebar ── */}
        <div className="flex flex-1 overflow-hidden">

          {/* Main */}
          <div className="flex-1 overflow-y-auto flex flex-col">
            {/* Title */}
            <div className="px-5 pt-4 pb-3 border-b border-white/[0.04]">
              <textarea
                value={editTitle}
                onChange={e => setEditTitle(e.target.value)}
                onBlur={() => { const t = editTitle.trim(); if (t && t !== item.title) saveField({ title: t }) }}
                rows={2}
                className="w-full bg-transparent text-[15px] font-semibold text-white resize-none focus:outline-none placeholder:text-white/20 leading-snug"
                placeholder="Task title"
              />
            </div>

            {/* Tabs */}
            <div className="flex items-center gap-0.5 px-5 py-2 border-b border-white/[0.04]">
              {TABS.map(t => (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={cn(
                    'flex items-center gap-1 px-2.5 py-1 rounded text-[10px] font-medium uppercase tracking-wider transition-colors',
                    tab === t.id ? 'bg-white/[0.07] text-white' : 'text-white/30 hover:text-white/60',
                  )}
                >
                  {t.label}
                  {t.badge ? <span className="text-[9px] text-white/30">{t.badge}</span> : null}
                </button>
              ))}
            </div>

            {/* Tab content */}
            <div className="flex-1 px-5 py-4 space-y-4">

              {tab === 'detail' && (
                <>
                  <textarea
                    value={editDesc}
                    onChange={e => setEditDesc(e.target.value)}
                    onBlur={() => { if (editDesc !== (item.description ?? '')) saveField({ description: editDesc || null }) }}
                    rows={10}
                    placeholder="Describe the work, context, and goals…"
                    className="w-full bg-white/[0.02] border border-white/[0.06] rounded-lg px-3 py-2.5 text-[12px] text-white/70 resize-none focus:outline-none focus:border-violet-500/40 placeholder:text-white/20 transition-colors leading-relaxed"
                  />

                  {/* Subtasks */}
                  <div>
                    <p className="text-[10px] font-semibold text-white/25 uppercase tracking-widest mb-2">Subtasks</p>
                    <div className="space-y-1 mb-2">
                      {subtasks.length === 0 && <p className="text-[11px] text-white/15">No subtasks yet.</p>}
                      {subtasks.map(sub => {
                        const done = sub.stage_id === doneStageId
                        return (
                          <div key={sub.id} className="flex items-center gap-2 py-1 group">
                            <button onClick={() => toggleSubtaskDone(sub)} className="text-white/25 hover:text-violet-400 transition-colors shrink-0">
                              {done
                                ? <CheckSquare size={13} className="text-emerald-400" />
                                : <Square size={13} />}
                            </button>
                            <span className={cn('flex-1 text-[12px]', done ? 'text-white/25 line-through' : 'text-white/70')}>
                              {sub.title}
                            </span>
                            {sub.assignee_id && (
                              <span className="text-[9px] text-white/20 font-mono">
                                {users.find(u => u.id === sub.assignee_id)?.name?.split(' ')[0] ?? '?'}
                              </span>
                            )}
                          </div>
                        )
                      })}
                    </div>
                    <div className="flex gap-2">
                      <input
                        value={newSubtask}
                        onChange={e => setNewSubtask(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') handleAddSubtask() }}
                        placeholder="Add subtask…"
                        className="flex-1 bg-white/[0.03] border border-white/[0.06] rounded px-2.5 py-1 text-[11px] text-white focus:outline-none focus:border-violet-500/40 placeholder:text-white/20 transition-colors"
                      />
                      <button
                        onClick={handleAddSubtask}
                        disabled={!newSubtask.trim()}
                        className="px-2.5 py-1 rounded bg-white/[0.05] hover:bg-white/[0.09] disabled:opacity-30 text-white/60 transition-colors"
                      >
                        <Plus size={12} />
                      </button>
                    </div>
                  </div>
                </>
              )}

              {tab === 'ac' && (
                <div>
                  <p className="text-[10px] font-semibold text-white/25 uppercase tracking-widest mb-2">Acceptance Criteria</p>
                  <textarea
                    value={editAC}
                    onChange={e => setEditAC(e.target.value)}
                    onBlur={() => { if (editAC !== (item.acceptance_criteria ?? '')) saveField({ acceptance_criteria: editAC || null }) }}
                    rows={16}
                    placeholder={'Define done — what must be true for this to be accepted?\n\n- [ ] Criterion 1\n- [ ] Criterion 2'}
                    className="w-full bg-white/[0.02] border border-white/[0.06] rounded-lg px-3 py-2.5 text-[12px] text-white/70 resize-none focus:outline-none focus:border-violet-500/40 placeholder:text-white/20 transition-colors leading-relaxed font-mono"
                  />
                </div>
              )}

              {tab === 'tech' && (
                <div>
                  <p className="text-[10px] font-semibold text-white/25 uppercase tracking-widest mb-2">Tech Notes</p>
                  <textarea
                    value={editTech}
                    onChange={e => setEditTech(e.target.value)}
                    onBlur={() => { if (editTech !== (item.tech_notes ?? '')) saveField({ tech_notes: editTech || null }) }}
                    rows={16}
                    placeholder="Implementation notes, architecture decisions, gotchas, links to PRs…"
                    className="w-full bg-white/[0.02] border border-white/[0.06] rounded-lg px-3 py-2.5 text-[12px] text-white/70 resize-none focus:outline-none focus:border-violet-500/40 placeholder:text-white/20 transition-colors leading-relaxed font-mono"
                  />
                </div>
              )}

              {tab === 'comments' && (
                <div>
                  <div className="space-y-3 mb-4">
                    {comments.length === 0 && <p className="text-[11px] text-white/15">No comments yet.</p>}
                    {comments.map(c => (
                      <div key={c.id} className="flex gap-2.5">
                        <div className="w-5 h-5 rounded-full bg-white/[0.07] flex items-center justify-center text-[9px] text-white/50 font-semibold shrink-0 mt-0.5">
                          {(c.author_name ?? '?')[0].toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-baseline gap-2 mb-0.5">
                            <span className="text-[11px] font-medium text-white/60">{c.author_name ?? 'Unknown'}</span>
                            <span className="text-[10px] text-white/20">{new Date(c.created_at).toLocaleString()}</span>
                          </div>
                          <p className="text-[12px] text-white/50 whitespace-pre-wrap leading-relaxed">{c.body}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input
                      className="flex-1 bg-white/[0.03] border border-white/[0.07] rounded px-3 py-1.5 text-[11px] text-white focus:outline-none focus:border-violet-500/40 placeholder:text-white/20 transition-colors"
                      placeholder="Add a comment…"
                      value={commentBody}
                      onChange={e => setCommentBody(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleComment() } }}
                    />
                    <button onClick={handleComment} disabled={!commentBody.trim()} className="px-2.5 py-1.5 rounded bg-violet-600 hover:bg-violet-500 disabled:opacity-30 transition-colors">
                      <Send size={11} className="text-white" />
                    </button>
                  </div>
                </div>
              )}

              {tab === 'files' && (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-[10px] font-semibold text-white/25 uppercase tracking-widest">Attachments</p>
                    <button
                      onClick={() => fileRef.current?.click()}
                      className="flex items-center gap-1 text-[10px] text-violet-400 hover:text-violet-300 transition-colors"
                    >
                      <Paperclip size={10} />Attach file
                    </button>
                    <input ref={fileRef} type="file" className="hidden" onChange={handleFileSelect} />
                  </div>
                  {attachErr && <p className="text-[11px] text-red-400 mb-2">{attachErr}</p>}
                  <div className="space-y-1.5">
                    {attachments.length === 0 && <p className="text-[11px] text-white/15">No files attached.</p>}
                    {attachments.map(att => (
                      <div key={att.id} className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-white/[0.02] border border-white/[0.05] group">
                        <FileText size={12} className="text-white/30 shrink-0" />
                        <span className="flex-1 text-[12px] text-white/70 truncate">{att.filename}</span>
                        <span className="text-[10px] text-white/25 shrink-0">{(att.size_bytes / 1024).toFixed(1)} KB</span>
                        <button onClick={() => handleDownload(att)} title="Download" className="text-white/25 hover:text-white/70 transition-colors">
                          <Download size={11} />
                        </button>
                        <button onClick={() => handleDeleteAttachment(att.id)} title="Remove" className="text-white/20 hover:text-red-400 transition-colors">
                          <XCircle size={11} />
                        </button>
                      </div>
                    ))}
                  </div>
                  <p className="text-[10px] text-white/15 mt-3">Max 5 MB per file. Files stored locally in your browser.</p>
                </div>
              )}
            </div>
          </div>

          {/* ── Sidebar ── */}
          <div className="w-52 shrink-0 border-l border-white/[0.05] overflow-y-auto px-3 py-4 space-y-0.5">

            <MetaField icon={<Layers size={10} />} label="Stage">
              <select className="meta-select" value={item.stage_id ?? ''} onChange={e => saveField({ stage_id: e.target.value || null })}>
                <option value="">No stage</option>
                {stages.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </MetaField>

            <MetaField icon={<Hash size={10} />} label="Type">
              <select className="meta-select" value={item.type} onChange={e => saveField({ type: e.target.value as WorkItemType })}>
                {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </MetaField>

            <MetaField icon={<AlertCircle size={10} />} label="Priority">
              <select className={cn('meta-select', PRIORITY_COLOR[item.priority])} value={item.priority} onChange={e => saveField({ priority: e.target.value as Priority })}>
                {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </MetaField>

            <MetaField icon={<User size={10} />} label="Assignee">
              <select className="meta-select" value={item.assignee_id ?? ''} onChange={e => saveField({ assignee_id: e.target.value || null })}>
                <option value="">Unassigned</option>
                {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
              </select>
            </MetaField>

            <MetaField icon={<Calendar size={10} />} label="Due date">
              <input type="date" className="meta-select" defaultValue={item.due_date ?? ''} onBlur={e => saveField({ due_date: e.target.value || null })} />
            </MetaField>

            <MetaField icon={<Hash size={10} />} label="Points">
              <input type="number" min={0} className="meta-select" defaultValue={item.story_points ?? ''} onBlur={e => saveField({ story_points: e.target.value ? Number(e.target.value) : null })} />
            </MetaField>

            <MetaField icon={<Link2 size={10} />} label="Epic">
              <select className="meta-select" value={item.epic_id ?? ''} onChange={e => saveField({ epic_id: e.target.value || null })}>
                <option value="">No epic</option>
                {epics.map(ep => <option key={ep.id} value={ep.id}>{ep.title}</option>)}
              </select>
            </MetaField>

            <MetaField icon={<BookOpen size={10} />} label="Wiki page">
              <select className="meta-select" value={item.wiki_page_id ?? ''} onChange={e => saveField({ wiki_page_id: e.target.value || null })}>
                <option value="">No link</option>
                {wikiPages.map(wp => <option key={wp.id} value={wp.id}>{wp.title}</option>)}
              </select>
            </MetaField>

            <MetaField icon={<Link2 size={10} />} label="Parent ticket">
              <select className="meta-select" value={item.parent_id ?? ''} onChange={e => saveField({ parent_id: e.target.value || null })}>
                <option value="">None</option>
                {parentCandidates.map(p => <option key={p.id} value={p.id}>[{p.type}] {p.title}</option>)}
              </select>
            </MetaField>

            <MetaField icon={<User size={10} />} label="Reporter">
              <select className="meta-select" value={item.reporter_id ?? ''} onChange={e => saveField({ reporter_id: e.target.value || null })}>
                <option value="">—</option>
                {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
              </select>
            </MetaField>

            {labels.length > 0 && (
              <div className="pt-2">
                <div className="flex items-center gap-1 mb-1.5">
                  <Tag size={10} className="text-white/25" />
                  <span className="text-[9px] font-semibold text-white/25 uppercase tracking-widest">Labels</span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {labels.map(label => (
                    <button
                      key={label.id}
                      onClick={() => handleLabelToggle(label.id)}
                      className={cn(
                        'text-[10px] px-1.5 py-0.5 rounded border transition-all',
                        selectedLabels.includes(label.id) ? 'border-transparent text-white' : 'border-white/[0.08] text-white/30 hover:text-white/60',
                      )}
                      style={selectedLabels.includes(label.id) ? { backgroundColor: label.color } : {}}
                    >
                      {label.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="pt-3 border-t border-white/[0.05]">
              <p className="text-[9px] text-white/15">Created {new Date(item.created_at).toLocaleDateString()}</p>
              <p className="text-[9px] text-white/15">Updated {new Date(item.updated_at).toLocaleDateString()}</p>
            </div>
          </div>
        </div>
      </div>

      {confirmDelete && (
        <ConfirmDialog
          title="Delete work item"
          message={`"${item.title}" will be permanently deleted.`}
          confirmLabel="Delete"
          danger
          onConfirm={handleDelete}
          onCancel={() => setConfirmDelete(false)}
        />
      )}
    </div>
  )
}

function MetaField({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <div className="py-1.5 border-b border-white/[0.04] last:border-0">
      <div className="flex items-center gap-1 mb-0.5">
        <span className="text-white/20">{icon}</span>
        <span className="text-[9px] font-semibold text-white/25 uppercase tracking-widest">{label}</span>
      </div>
      {children}
    </div>
  )
}
