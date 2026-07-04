import { useState, useEffect, useCallback } from 'react'
import { X, Trash2, MessageSquare, Send, Calendar, User, Share2, Tag, Layers, AlertCircle, Hash } from 'lucide-react'
import { exportTaskCard } from '@/lib/htmlExport/exporter'
import { useLiveQuery } from '@electric-sql/pglite-react'
import type { DbWorkItem, DbCustomStage, DbLabel, DbUser, WorkItemType, Priority } from '@/types/db'
import {
  updateWorkItem, deleteWorkItem, getComments, addComment,
  getItemLabels, setItemLabels,
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
  const [editTitle, setEditTitle] = useState(item.title)
  const [editDesc, setEditDesc] = useState(item.description ?? '')
  const [saving, setSaving] = useState(false)
  const [commentBody, setCommentBody] = useState('')
  const [comments, setComments] = useState<CommentRow[]>([])
  const [selectedLabels, setSelectedLabels] = useState<string[]>([])
  const [confirmDelete, setConfirmDelete] = useState(false)

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

  const loadComments = useCallback(async () => {
    const rows = await getComments(item.id)
    setComments(rows as CommentRow[])
  }, [item.id])

  useEffect(() => {
    loadComments()
    getItemLabels(item.id).then(setSelectedLabels)
  }, [item.id, loadComments])

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

            {/* Description */}
            <div>
              <p className="text-[10px] font-semibold text-white/25 uppercase tracking-widest mb-1.5">Description</p>
              <textarea
                value={editDesc}
                onChange={e => setEditDesc(e.target.value)}
                onBlur={handleDescBlur}
                rows={6}
                placeholder="Add a description…"
                className="w-full bg-white/[0.02] border border-white/[0.06] rounded-lg px-3 py-2 text-[12px] text-white/70 resize-none focus:outline-none focus:border-violet-500/40 placeholder:text-white/20 transition-colors leading-relaxed"
              />
            </div>

            {/* Comments */}
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
