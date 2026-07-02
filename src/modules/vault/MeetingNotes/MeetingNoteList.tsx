import { useState } from 'react'
import { useLiveQuery } from '@electric-sql/pglite-react'
import { Plus, Trash2, FileText, Share2 } from 'lucide-react'
import { useProject } from '@/hooks/useProject'
import { saveMeetingNote, deleteMeetingNote } from '@/db/queries/vault'
import { exportMeetingNote } from '@/lib/htmlExport/exporter'
import type { DbMeetingNote } from '@/types/db'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { fmtDate } from '@/lib/utils/dates'

export default function MeetingNoteList() {
  const { projectId } = useProject()
  const [creating, setCreating] = useState(false)
  const [selected, setSelected] = useState<DbMeetingNote | null>(null)
  const [form, setForm] = useState({ title: '', meeting_date: new Date().toISOString().split('T')[0], attendees: '', body: '' })

  const result = useLiveQuery<DbMeetingNote>(`SELECT * FROM meeting_notes WHERE project_id = $1 ORDER BY meeting_date DESC`, [projectId ?? ''])
  const notes = result?.rows ?? []

  async function handleSave() {
    if (!form.title.trim() || !projectId) return
    await saveMeetingNote({
      id: selected?.id ?? crypto.randomUUID(),
      project_id: projectId,
      title: form.title,
      meeting_date: form.meeting_date,
      attendees: form.attendees || null,
      body: form.body || null,
    })
    setCreating(false)
    setSelected(null)
    setForm({ title: '', meeting_date: new Date().toISOString().split('T')[0], attendees: '', body: '' })
  }

  function handleEdit(note: DbMeetingNote) {
    setSelected(note)
    setForm({ title: note.title, meeting_date: note.meeting_date, attendees: note.attendees ?? '', body: note.body ?? '' })
    setCreating(true)
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-[13px] font-semibold text-white/60 uppercase tracking-wider flex items-center gap-2">
          <FileText size={13} className="text-white/40" strokeWidth={1.8} />
          Meeting Notes
        </h2>
        <Button size="sm" onClick={() => { setCreating(true); setSelected(null); setForm({ title: '', meeting_date: new Date().toISOString().split('T')[0], attendees: '', body: '' }) }} className="gap-1.5">
          <Plus size={13} strokeWidth={2.5} />New note
        </Button>
      </div>

      {creating && (
        <div className="bg-[#141416] border border-white/[0.07] rounded-xl p-5 mb-6 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-medium text-white/30 uppercase tracking-wider mb-1.5">Title</label>
              <Input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} placeholder="Meeting title" autoFocus />
            </div>
            <div>
              <label className="block text-[10px] font-medium text-white/30 uppercase tracking-wider mb-1.5">Date</label>
              <Input type="date" value={form.meeting_date} onChange={(e) => setForm((f) => ({ ...f, meeting_date: e.target.value }))} />
            </div>
          </div>
          <div>
            <label className="block text-[10px] font-medium text-white/30 uppercase tracking-wider mb-1.5">Attendees</label>
            <Input value={form.attendees} onChange={(e) => setForm((f) => ({ ...f, attendees: e.target.value }))} placeholder="Alice, Bob, Charlie" />
          </div>
          <div>
            <label className="block text-[10px] font-medium text-white/30 uppercase tracking-wider mb-1.5">Notes</label>
            <Textarea rows={8} value={form.body} onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))} placeholder="## Agenda&#10;&#10;- Item 1" />
          </div>
          <div className="flex gap-2 pt-1">
            <Button size="sm" onClick={handleSave}>Save</Button>
            <Button variant="ghost" size="sm" onClick={() => setCreating(false)}>Cancel</Button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {notes.length === 0 ? (
          <p className="text-white/25 text-sm text-center py-16">No meeting notes yet</p>
        ) : notes.map((note) => (
          <div
            key={note.id}
            className="group bg-[#141416] border border-white/[0.07] rounded-xl p-4 hover:border-white/[0.14] hover:bg-[#1a1a1e] transition-all cursor-pointer"
            onClick={() => handleEdit(note)}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h3 className="font-medium text-white text-[14px]">{note.title}</h3>
                <p className="text-[12px] text-white/35 mt-0.5">{fmtDate(note.meeting_date)}{note.attendees ? ` · ${note.attendees}` : ''}</p>
              </div>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                <button
                  onClick={(e) => { e.stopPropagation(); exportMeetingNote(note) }}
                  className="w-6 h-6 flex items-center justify-center rounded text-white/25 hover:text-violet-400 hover:bg-white/[0.06] transition-all"
                  title="Export as HTML"
                >
                  <Share2 size={13} />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); deleteMeetingNote(note.id) }}
                  className="w-6 h-6 flex items-center justify-center rounded text-white/25 hover:text-red-400 hover:bg-white/[0.06] transition-all"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
            {note.body && <p className="text-[12px] text-white/40 mt-2 line-clamp-2 leading-relaxed">{note.body}</p>}
          </div>
        ))}
      </div>
    </div>
  )
}
