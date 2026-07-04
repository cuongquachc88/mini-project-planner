import { useState, useEffect, useCallback, useRef } from 'react'
import {
  X, Trash2, MessageSquare, Send, Calendar, User, Share2, Tag, Layers, AlertCircle,
  Hash, ExternalLink, Link2, Paperclip, Download, CheckSquare, Square, Plus,
} from 'lucide-react'
import { exportTaskCard } from '@/lib/htmlExport/exporter'
import { useLiveQuery } from '@electric-sql/pglite-react'
import type { DbWorkItem, DbWorkItemAttachment, DbCustomStage, DbLabel, DbUser, DbEpic, DbWikiPage, WorkItemType, Priority } from '@/types/db'
import {
  updateWorkItem, deleteWorkItem, getComments, addComment,
  getItemLabels, setItemLabels, getSubtasks, getAttachments, addAttachment, deleteAttachment,
  getAttachmentData, createWorkItem,
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

const TEXTAREA_CLS = 'w-full bg-white/[0.02] border border-white/[0.06] rounded-lg px-3 py-2 text-[12px] text-white/70 resize-none focus:outline-none focus:border-violet-500/40 placeholder:text-white/20 transition-colors leading-relaxed'

type Tab = 'detail' | 'ac' | 'tech' | 'comments' | 'files'

interface CommentRow {
  id: string
  body: string
  created_at: string
  author_name: string | null
  author_avatar: string | null
}

interface Props {
  item: DbWorkItem
  projectId: string
  onClose: () => void
  onDeleted: () => void
}

export function WorkItemDetail({ item, projectId, onClose, onDeleted }: Props) {
  const { currentUser } = useStore()

  // Tab state
  const [activeTab, setActiveTab] = useState<Tab>('detail')

  // Main content state
  const [editTitle, setEditTitle] = useState(item.title)
  const [editDesc, setEditDesc] = useState(item.description ?? '')
  const [editAC, setEditAC] = useState(item.acceptance_criteria ?? '')
  const [editTech, setEditTech] = useState(item.tech_notes ?? '')
  const [saving, setSaving] = useState(false)

  // Comments
  const [commentBody, setCommentBody] = useState('')
  const [comments, setComments] = useState<CommentRow[]>([])

  // Labels
  const [selectedLabels, setSelectedLabels] = useState<string[]>([])

  // Subtasks
  const [subtasks, setSubtasks] = useState<DbWorkItem[]>([])
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('')

  // Attachments
  const [attachments, setAttachments] = useState<Omit<DbWorkItemAttachment, 'data'>[]>([])
  const [fileError, setFileError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Misc
  const [confirmDelete, setConfirmDelete] = useState(false)

  // Live queries
  const stages = useLiveQuery<DbCustomStage>(
    `SELECT * FROM custom_stages WHERE project_id = $1 ORDER BY position`,
    [projectId],
  )?.rows ?? []

  const users = useLiveQuery<DbUser>(
    `SELECT * FROM users ORDER BY name`,
    [],
  )?.rows ?? []

  const labels = useLiveQuery<DbLabel>(
    `SELECT * FROM labels WHERE project_id = $1 ORDER BY name`,
    [projectId],
  )?.rows ?? []

  const epics = useLiveQuery<DbEpic>(
    `SELECT id, title FROM epics WHERE project_id = $1 ORDER BY title`,
    [projectId],
  )?.rows ?? []

  const wikiPages = useLiveQuery<DbWikiPage>(
    `SELECT id, title FROM wiki_pages WHERE project_id = $1 ORDER BY title`,
    [projectId],
  )?.rows ?? []

  const otherItems = useLiveQuery<{ id: string; title: string; type: WorkItemType }>(
    `SELECT id, title, type FROM work_items WHERE project_id = $1 AND id != $2 ORDER BY title LIMIT 100`,
    [projectId, item.id],
  )?.rows ?? []

  // Load async data
  const loadComments = useCallback(async () => {
    const rows = await getComments(item.id)
    setComments(rows as CommentRow[])
  }, [item.id])

  const loadSubtasks = useCallback(async () => {
    const rows = await getSubtasks(item.id)
    setSubtasks(rows)
  }, [item.id])

  const loadAttachments = useCallback(async () => {
    const rows = await getAttachments(item.id)
    setAttachments(rows)
  }, [item.id])

  useEffect(() => {
    loadComments()
    loadSubtasks()
    loadAttachments()
    getItemLabels(item.id).then(setSelectedLabels)
  }, [item.id, loadComments, loadSubtasks, loadAttachments])

  // Sync local state when item prop changes
  useEffect(() => {
    setEditTitle(item.title)
    setEditDesc(item.description ?? '')
    setEditAC(item.acceptance_criteria ?? '')
    setEditTech(item.tech_notes ?? '')
  }, [item.id, item.title, item.description, item.acceptance_criteria, item.tech_notes])

  async function saveField(field: Partial<DbWorkItem>) {
    setSaving(true)
    await updateWorkItem(item.id, field)
    setSaving(false)
  }

  async function handleTitleBlur() {
    const t = editTitle.trim()
    if (t && t !== item.title) await saveField({ title: t })
  }

  async function handleDescBlur() {
    if (editDesc !== (item.description ?? '')) await saveField({ description: editDesc || null })
  }

  async function handleACBlur() {
    if (editAC !== (item.acceptance_criteria ?? '')) await saveField({ acceptance_criteria: editAC || null })
  }

  async function handleTechBlur() {
    if (editTech !== (item.tech_notes ?? '')) await saveField({ tech_notes: editTech || null })
  }

  async function handleComment() {
    if (!commentBody.trim() || !currentUser) return
    await addComment(item.id, currentUser.id, commentBody.trim())
    setCommentBody('')
    loadComments()
  }

  async function handleLabelToggle(labelId: string) {
    const next = selectedLabels.includes(labelId)
      ? selectedLabels.filter(l => l !== labelId)
      : [...selectedLabels, labelId]
    setSelectedLabels(next)
    await setItemLabels(item.id, next)
  }

  async function handleDelete() {
    await deleteWorkItem(item.id)
    onDeleted()
    onClose()
  }

  // Subtask handlers
  async function handleAddSubtask() {
    const title = newSubtaskTitle.trim()
    if (!title) return
    await createWorkItem({
      projectId,
      title,
      type: 'task',
      parentId: item.id,
    })
    setNewSubtaskTitle('')
    loadSubtasks()
  }

  async function handleSubtaskToggle(subtask: DbWorkItem) {
    const doneStage = stages.find(s => s.is_done)
    if (!doneStage) return
    const newStageId = subtask.stage_id === doneStage.id ? null : doneStage.id
    await updateWorkItem(subtask.id, { stage_id: newStageId })
    loadSubtasks()
  }

  // File attachment handlers
  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setFileError(null)

    const MAX_BYTES = 5 * 1024 * 1024
    if (file.size > MAX_BYTES) {
      setFileError(`File too large (max 5 MB). This file is ${(file.size / 1024 / 1024).toFixed(1)} MB.`)
      if (fileInputRef.current) fileInputRef.current.value = ''
      return
    }

    const reader = new FileReader()
    reader.onload = async () => {
      const base64 = (reader.result as string).split(',')[1]
      await addAttachment(item.id, file.name, file.type, base64)
      loadAttachments()
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
    reader.readAsDataURL(file)
  }

  async function handleDeleteAttachment(id: string) {
    await deleteAttachment(id)
    loadAttachments()
  }

  async function handleDownloadAttachment(att: Omit<DbWorkItemAttachment, 'data'>) {
    const row = await getAttachmentData(att.id)
    if (!row) return
    const byteChars = atob(row.data)
    const bytes = new Uint8Array(byteChars.length)
    for (let i = 0; i < byteChars.length; i++) bytes[i] = byteChars.charCodeAt(i)
    const blob = new Blob([bytes], { type: row.mime_type })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = row.filename
    a.click()
    URL.revokeObjectURL(url)
  }

  function formatBytes(n: number) {
    if (n < 1024) return `${n} B`
    if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`
    return `${(n / 1024 / 1024).toFixed(1)} MB`
  }

  const TABS: { id: Tab; label: string }[] = [
    { id: 'detail', label: 'Detail' },
    { id: 'ac', label: 'AC' },
    { id: 'tech', label: 'Tech Notes' },
    { id: 'comments', label: `Comments${comments.length > 0 ? ` (${comments.length})` : ''}` },
    { id: 'files', label: `Files${attachments.length > 0 ? ` (${attachments.length})` : ''}` },
  ]

  const doneStage = stages.find(s => s.is_done)
  const selectedWikiPage = wikiPages.find(p => p.id === item.wiki_page_id)

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-end bg-black/60 backdrop-blur-[2px]" onClick={onClose}>
      <div
        className="h-full w-full max-w-3xl flex flex-col border-l border-white/[0.07] overflow-hidden"
        style={{ background: '#111113' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="shrink-0 flex items-center gap-2.5 px-5 py-3 border-b border-white/[0.06] bg-[#0f0f11]">
          <span className={cn('text-[10px] font-semibold px-1.5 py-0.5 rounded uppercase tracking-wide', TYPE_COLOR[item.type])}>
            {item.type}
          </span>
          <span className="text-[10px] text-white/20 font-mono">{item.id.slice(0, 8)}</span>
          {saving && <span className="text-[10px] text-white/25 ml-1">saving…</span>}
          <div className="ml-auto flex items-center gap-1">
            <button
              onClick={() => exportTaskCard(item)}
              className="flex items-center gap-1 text-[10px] text-white/30 hover:text-white/60 px-2 py-1 rounded hover:bg-white/[0.04] transition-colors"
            >
              <Share2 size={11} />Export
            </button>
            <button
              onClick={() => setConfirmDelete(true)}
              className="flex items-center gap-1 text-[10px] text-white/30 hover:text-red-400 px-2 py-1 rounded hover:bg-red-500/[0.06] transition-colors"
            >
              <Trash2 size={11} />Delete
            </button>
            <button onClick={onClose} className="ml-1 text-white/25 hover:text-white/70 transition-colors p-1 rounded hover:bg-white/[0.04]">
              <X size={15} />
            </button>
          </div>
        </div>

        {/* Body: main + sidebar */}
        <div className="flex flex-1 overflow-hidden">

          {/* Main content */}
          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
            {/* Title */}
            <textarea
              value={editTitle}
              onChange={e => setEditTitle(e.target.value)}
              onBlur={handleTitleBlur}
              rows={2}
              className="w-full bg-transparent text-[15px] font-semibold text-white resize-none focus:outline-none placeholder:text-white/20 leading-snug"
              placeholder="Task title"
            />

            {/* Tabs */}
            <div className="flex items-center gap-1">
              {TABS.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    'px-2.5 py-1 rounded text-[10px] font-semibold uppercase tracking-wide transition-colors',
                    activeTab === tab.id
                      ? 'bg-white/[0.06] text-white'
                      : 'text-white/30 hover:text-white/50',
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab content */}
            {activeTab === 'detail' && (
              <div>
                <p className="text-[10px] font-semibold text-white/25 uppercase tracking-widest mb-1.5">Description</p>
                <textarea
                  value={editDesc}
                  onChange={e => setEditDesc(e.target.value)}
                  onBlur={handleDescBlur}
                  rows={8}
                  placeholder="Add a description…"
                  className={TEXTAREA_CLS}
                />
              </div>
            )}

            {activeTab === 'ac' && (
              <div>
                <p className="text-[10px] font-semibold text-white/25 uppercase tracking-widest mb-1.5">Acceptance Criteria</p>
                <textarea
                  value={editAC}
                  onChange={e => setEditAC(e.target.value)}
                  onBlur={handleACBlur}
                  rows={10}
                  placeholder="Define done: what must be true for this to be accepted?"
                  className={TEXTAREA_CLS}
                />
              </div>
            )}

            {activeTab === 'tech' && (
              <div>
                <p className="text-[10px] font-semibold text-white/25 uppercase tracking-widest mb-1.5">Tech Notes</p>
                <textarea
                  value={editTech}
                  onChange={e => setEditTech(e.target.value)}
                  onBlur={handleTechBlur}
                  rows={10}
                  placeholder="Implementation notes, architecture decisions, gotchas…"
                  className={TEXTAREA_CLS}
                />
              </div>
            )}

            {activeTab === 'comments' && (
              <div>
                <div className="flex items-center gap-1.5 mb-2.5">
                  <MessageSquare size={11} className="text-white/25" />
                  <p className="text-[10px] font-semibold text-white/25 uppercase tracking-widest">
                    Comments {comments.length > 0 && <span className="text-white/20">({comments.length})</span>}
                  </p>
                </div>

                <div className="space-y-3 mb-3">
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
                  {comments.length === 0 && (
                    <p className="text-[11px] text-white/15 py-2">No comments yet.</p>
                  )}
                </div>

                <div className="flex gap-2">
                  <input
                    className="flex-1 bg-white/[0.03] border border-white/[0.07] rounded-md px-3 py-1.5 text-[11px] text-white focus:outline-none focus:border-violet-500/40 placeholder:text-white/20 transition-colors"
                    placeholder="Add a comment…"
                    value={commentBody}
                    onChange={e => setCommentBody(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleComment() } }}
                  />
                  <button
                    onClick={handleComment}
                    disabled={!commentBody.trim()}
                    className="px-2.5 py-1.5 rounded-md bg-violet-600 hover:bg-violet-500 disabled:opacity-30 transition-colors"
                  >
                    <Send size={11} className="text-white" />
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'files' && (
              <div>
                <div className="flex items-center gap-1.5 mb-2.5">
                  <Paperclip size={11} className="text-white/25" />
                  <p className="text-[10px] font-semibold text-white/25 uppercase tracking-widest">Attachments</p>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  onChange={handleFileChange}
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-1.5 text-[11px] text-white/40 hover:text-white/70 px-3 py-1.5 rounded-md border border-white/[0.07] hover:border-white/[0.15] transition-colors mb-3"
                >
                  <Plus size={11} />
                  Attach file
                </button>

                {fileError && (
                  <p className="text-[11px] text-red-400 mb-2">{fileError}</p>
                )}

                {attachments.length === 0 && (
                  <p className="text-[11px] text-white/15 py-2">No files attached yet.</p>
                )}

                <div className="space-y-1.5">
                  {attachments.map(att => (
                    <div key={att.id} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/[0.02] border border-white/[0.05]">
                      <Paperclip size={11} className="text-white/25 shrink-0" />
                      <span className="flex-1 text-[11px] text-white/60 truncate">{att.filename}</span>
                      <span className="text-[10px] text-white/20 shrink-0">{formatBytes(att.size_bytes)}</span>
                      <button
                        onClick={() => handleDownloadAttachment(att)}
                        className="text-white/30 hover:text-white/60 transition-colors p-0.5"
                        title="Download"
                      >
                        <Download size={11} />
                      </button>
                      <button
                        onClick={() => handleDeleteAttachment(att.id)}
                        className="text-white/20 hover:text-red-400 transition-colors p-0.5"
                        title="Delete"
                      >
                        <X size={11} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Subtasks section — always visible below tabs */}
            <div className="border-t border-white/[0.05] pt-4">
              <div className="flex items-center gap-1.5 mb-2.5">
                <CheckSquare size={11} className="text-white/25" />
                <p className="text-[10px] font-semibold text-white/25 uppercase tracking-widest">
                  Subtasks {subtasks.length > 0 && <span className="text-white/20">({subtasks.length})</span>}
                </p>
              </div>

              <div className="space-y-1 mb-2.5">
                {subtasks.map(sub => {
                  const isDone = doneStage ? sub.stage_id === doneStage.id : false
                  const assigneeUser = users.find(u => u.id === sub.assignee_id)
                  return (
                    <div key={sub.id} className="flex items-center gap-2 py-1">
                      <button onClick={() => handleSubtaskToggle(sub)} className="text-white/30 hover:text-violet-400 transition-colors shrink-0">
                        {isDone
                          ? <CheckSquare size={13} className="text-violet-400" />
                          : <Square size={13} />
                        }
                      </button>
                      <span className={cn('flex-1 text-[12px]', isDone ? 'text-white/25 line-through' : 'text-white/60')}>
                        {sub.title}
                      </span>
                      {assigneeUser && (
                        <div className="w-4 h-4 rounded-full bg-white/[0.07] flex items-center justify-center text-[8px] text-white/40 font-semibold shrink-0">
                          {assigneeUser.name[0].toUpperCase()}
                        </div>
                      )}
                    </div>
                  )
                })}
                {subtasks.length === 0 && (
                  <p className="text-[11px] text-white/15">No subtasks yet.</p>
                )}
              </div>

              <div className="flex gap-2">
                <input
                  className="flex-1 bg-white/[0.02] border border-white/[0.06] rounded-md px-2.5 py-1.5 text-[11px] text-white focus:outline-none focus:border-violet-500/40 placeholder:text-white/20 transition-colors"
                  placeholder="New subtask title…"
                  value={newSubtaskTitle}
                  onChange={e => setNewSubtaskTitle(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddSubtask() } }}
                />
                <button
                  onClick={handleAddSubtask}
                  disabled={!newSubtaskTitle.trim()}
                  className="px-2.5 py-1.5 rounded-md text-[11px] bg-white/[0.05] hover:bg-white/[0.09] disabled:opacity-30 text-white/60 transition-colors"
                >
                  Add
                </button>
              </div>
            </div>
          </div>

          {/* Sidebar metadata */}
          <div className="w-52 shrink-0 border-l border-white/[0.05] overflow-y-auto px-3 py-4 space-y-1">

            <MetaField icon={<Layers size={10} />} label="Stage">
              <select
                className="meta-select"
                value={item.stage_id ?? ''}
                onChange={e => saveField({ stage_id: e.target.value || null })}
              >
                <option value="">No stage</option>
                {stages.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </MetaField>

            <MetaField icon={<Hash size={10} />} label="Type">
              <select
                className="meta-select"
                value={item.type}
                onChange={e => saveField({ type: e.target.value as WorkItemType })}
              >
                {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </MetaField>

            <MetaField icon={<AlertCircle size={10} />} label="Priority">
              <select
                className={cn('meta-select', PRIORITY_COLOR[item.priority])}
                value={item.priority}
                onChange={e => saveField({ priority: e.target.value as Priority })}
              >
                {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </MetaField>

            <MetaField icon={<User size={10} />} label="Assignee">
              <select
                className="meta-select"
                value={item.assignee_id ?? ''}
                onChange={e => saveField({ assignee_id: e.target.value || null })}
              >
                <option value="">Unassigned</option>
                {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
              </select>
            </MetaField>

            <MetaField icon={<Calendar size={10} />} label="Due date">
              <input
                type="date"
                className="meta-select"
                defaultValue={item.due_date ?? ''}
                onBlur={e => saveField({ due_date: e.target.value || null })}
              />
            </MetaField>

            <MetaField icon={<Hash size={10} />} label="Points">
              <input
                type="number"
                min={0}
                className="meta-select"
                defaultValue={item.story_points ?? ''}
                onBlur={e => saveField({ story_points: e.target.value ? Number(e.target.value) : null })}
              />
            </MetaField>

            <MetaField icon={<Layers size={10} />} label="Epic">
              <select
                className="meta-select"
                value={item.epic_id ?? ''}
                onChange={e => saveField({ epic_id: e.target.value || null })}
              >
                <option value="">No epic</option>
                {epics.map(ep => <option key={ep.id} value={ep.id}>{ep.title}</option>)}
              </select>
            </MetaField>

            <MetaField icon={<Link2 size={10} />} label="Wiki page">
              <div className="flex items-center gap-1">
                <select
                  className="meta-select flex-1"
                  value={item.wiki_page_id ?? ''}
                  onChange={e => saveField({ wiki_page_id: e.target.value || null })}
                >
                  <option value="">No wiki page</option>
                  {wikiPages.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
                </select>
                {selectedWikiPage && (
                  <span title={selectedWikiPage.title}><ExternalLink size={10} className="text-white/25 shrink-0" /></span>
                )}
              </div>
            </MetaField>

            <MetaField icon={<Link2 size={10} />} label="Parent ticket">
              <select
                className="meta-select"
                value={item.parent_id ?? ''}
                onChange={e => saveField({ parent_id: e.target.value || null })}
              >
                <option value="">No parent</option>
                {otherItems.map(wi => <option key={wi.id} value={wi.id}>[{wi.type}] {wi.title}</option>)}
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
                        selectedLabels.includes(label.id)
                          ? 'border-transparent text-white'
                          : 'border-white/[0.08] text-white/30 hover:text-white/60',
                      )}
                      style={selectedLabels.includes(label.id) ? { backgroundColor: label.color } : {}}
                    >
                      {label.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
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
      <div className="flex items-center gap-1 mb-1">
        <span className="text-white/20">{icon}</span>
        <span className="text-[9px] font-semibold text-white/25 uppercase tracking-widest">{label}</span>
      </div>
      {children}
    </div>
  )
}
