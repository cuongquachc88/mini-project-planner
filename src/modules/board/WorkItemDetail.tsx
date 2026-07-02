import { useState, useEffect, useCallback } from 'react'
import { X, Trash2, MessageSquare, Send, Calendar, User, Share2 } from 'lucide-react'
import { exportTaskCard } from '@/lib/htmlExport/exporter'
import { useLiveQuery } from '@electric-sql/pglite-react'
import type { DbWorkItem, DbCustomStage, DbLabel, DbUser, WorkItemType, Priority } from '@/types/db'
import {
  updateWorkItem, deleteWorkItem, getComments, addComment,
  getItemLabels, setItemLabels,
} from '@/db/queries/workItems'
import { useStore } from '@/store'
import { Button } from '@/components/ui/Button'
import { PriorityBadge } from '@/components/PriorityBadge'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { cn } from '@/lib/utils/cn'

const TYPES: WorkItemType[] = ['story', 'bug', 'spike', 'task', 'action', 'request']
const PRIORITIES: Priority[] = ['critical', 'high', 'medium', 'low']

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

  const stagesResult = useLiveQuery<DbCustomStage>(
    `SELECT * FROM custom_stages WHERE project_id = $1 ORDER BY position`,
    [projectId],
  )
  const stages = stagesResult?.rows ?? []

  const usersResult = useLiveQuery<DbUser>(
    `SELECT * FROM users ORDER BY name`,
    [],
  )
  const users = usersResult?.rows ?? []

  const labelsResult = useLiveQuery<DbLabel>(
    `SELECT * FROM labels WHERE project_id = $1 ORDER BY name`,
    [projectId],
  )
  const labels = labelsResult?.rows ?? []

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
    const trimmed = editTitle.trim()
    if (trimmed && trimmed !== item.title) await saveField({ title: trimmed })
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
      ? selectedLabels.filter((l) => l !== labelId)
      : [...selectedLabels, labelId]
    setSelectedLabels(next)
    await setItemLabels(item.id, next)
  }

  async function handleDelete() {
    await deleteWorkItem(item.id)
    onDeleted()
    onClose()
  }

  const assignee = users.find((u) => u.id === item.assignee_id)

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-end bg-black/60" onClick={onClose}>
      <div
        className="h-full w-full max-w-2xl bg-slate-900 border-l border-slate-700/60 overflow-y-auto flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-700/60 sticky top-0 bg-slate-900 z-10">
          <span className="text-xs text-slate-500 font-mono uppercase">{item.type}</span>
          <PriorityBadge priority={item.priority} />
          {saving && <span className="text-xs text-slate-500 ml-auto">Saving…</span>}
          <button onClick={onClose} className="ml-auto text-slate-500 hover:text-slate-200 transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 p-6 space-y-6">
          {/* Title */}
          <textarea
            className="input w-full text-lg font-semibold text-slate-100 bg-transparent border-none resize-none leading-snug focus:ring-0 focus:border-b focus:border-brand-500 p-0"
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            onBlur={handleTitleBlur}
            rows={2}
          />

          {/* Metadata grid */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            <Field label="Stage">
              <select
                className="input text-sm py-1"
                value={item.stage_id ?? ''}
                onChange={(e) => saveField({ stage_id: e.target.value || null })}
              >
                <option value="">No stage</option>
                {stages.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </Field>

            <Field label="Type">
              <select
                className="input text-sm py-1"
                value={item.type}
                onChange={(e) => saveField({ type: e.target.value as WorkItemType })}
              >
                {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </Field>

            <Field label="Priority">
              <select
                className="input text-sm py-1"
                value={item.priority}
                onChange={(e) => saveField({ priority: e.target.value as Priority })}
              >
                {PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </Field>

            <Field label="Story points">
              <input
                type="number"
                min={0}
                className="input text-sm py-1 w-full"
                defaultValue={item.story_points ?? ''}
                onBlur={(e) => {
                  const val = e.target.value ? Number(e.target.value) : null
                  saveField({ story_points: val })
                }}
              />
            </Field>

            <Field label="Assignee">
              <div className="flex items-center gap-2">
                {assignee ? (
                  <div className="w-5 h-5 rounded-full bg-brand-500/30 flex items-center justify-center text-xs text-brand-300 font-medium">
                    {assignee.name[0].toUpperCase()}
                  </div>
                ) : (
                  <User size={14} className="text-slate-500" />
                )}
                <select
                  className="input text-sm py-1 flex-1"
                  value={item.assignee_id ?? ''}
                  onChange={(e) => saveField({ assignee_id: e.target.value || null })}
                >
                  <option value="">Unassigned</option>
                  {users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
                </select>
              </div>
            </Field>

            <Field label="Due date">
              <div className="flex items-center gap-2">
                <Calendar size={14} className="text-slate-500 shrink-0" />
                <input
                  type="date"
                  className="input text-sm py-1 flex-1"
                  defaultValue={item.due_date ?? ''}
                  onBlur={(e) => saveField({ due_date: e.target.value || null })}
                />
              </div>
            </Field>
          </div>

          {/* Labels */}
          {labels.length > 0 && (
            <div>
              <p className="text-xs font-medium text-slate-400 mb-2">Labels</p>
              <div className="flex flex-wrap gap-1.5">
                {labels.map((label) => (
                  <button
                    key={label.id}
                    onClick={() => handleLabelToggle(label.id)}
                    className={cn(
                      'text-xs px-2 py-0.5 rounded-full border transition-all',
                      selectedLabels.includes(label.id)
                        ? 'border-transparent text-white'
                        : 'border-slate-600 text-slate-400 bg-transparent',
                    )}
                    style={selectedLabels.includes(label.id) ? { backgroundColor: label.color } : {}}
                  >
                    {label.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Description */}
          <div>
            <p className="text-xs font-medium text-slate-400 mb-2">Description</p>
            <textarea
              className="input w-full text-sm text-slate-300 resize-none"
              rows={5}
              placeholder="Add a description…"
              value={editDesc}
              onChange={(e) => setEditDesc(e.target.value)}
              onBlur={handleDescBlur}
            />
          </div>

          {/* Comments */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <MessageSquare size={14} className="text-slate-400" />
              <p className="text-xs font-medium text-slate-400">Comments ({comments.length})</p>
            </div>

            <div className="space-y-3 mb-4">
              {comments.map((c) => (
                <div key={c.id} className="flex gap-3">
                  <div className="w-7 h-7 rounded-full bg-slate-700 flex items-center justify-center text-xs text-slate-300 font-medium shrink-0">
                    {(c.author_name ?? '?')[0].toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-baseline gap-2 mb-0.5">
                      <span className="text-xs font-medium text-slate-300">{c.author_name ?? 'Unknown'}</span>
                      <span className="text-xs text-slate-500">{new Date(c.created_at).toLocaleString()}</span>
                    </div>
                    <p className="text-sm text-slate-300 whitespace-pre-wrap">{c.body}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <input
                className="input flex-1 text-sm py-1.5"
                placeholder="Add a comment…"
                value={commentBody}
                onChange={(e) => setCommentBody(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleComment() } }}
              />
              <Button size="sm" onClick={handleComment} disabled={!commentBody.trim()} className="gap-1.5">
                <Send size={13} />
              </Button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-700/60 flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={() => exportTaskCard(item)} className="gap-1.5">
            <Share2 size={13} />
            Export HTML
          </Button>
          <Button variant="destructive" size="sm" onClick={() => setConfirmDelete(true)} className="gap-1.5">
            <Trash2 size={13} />
            Delete item
          </Button>
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

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-medium text-slate-400 mb-1">{label}</p>
      {children}
    </div>
  )
}
