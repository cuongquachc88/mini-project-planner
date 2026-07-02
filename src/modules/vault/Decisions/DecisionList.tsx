import { useState } from 'react'
import { useLiveQuery } from '@electric-sql/pglite-react'
import { Plus, Trash2, BookMarked } from 'lucide-react'
import { useProject } from '@/hooks/useProject'
import { saveDecision, deleteDecision } from '@/db/queries/vault'
import type { DbDecision } from '@/types/db'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { fmtDate } from '@/lib/utils/dates'

export default function DecisionList() {
  const { projectId } = useProject()
  const [creating, setCreating] = useState(false)
  const [selected, setSelected] = useState<DbDecision | null>(null)
  const blankForm = { title: '', decision: '', rationale: '', decided_at: new Date().toISOString().split('T')[0] }
  const [form, setForm] = useState(blankForm)

  const result = useLiveQuery<DbDecision>(`SELECT * FROM decisions WHERE project_id = $1 ORDER BY decided_at DESC`, [projectId ?? ''])
  const decisions = result?.rows ?? []

  async function handleSave() {
    if (!form.title.trim() || !form.decision.trim() || !projectId) return
    await saveDecision({ id: selected?.id ?? crypto.randomUUID(), project_id: projectId, title: form.title, decision: form.decision, rationale: form.rationale || null, owner_id: null, decided_at: form.decided_at })
    setCreating(false); setSelected(null); setForm(blankForm)
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-[13px] font-semibold text-white/60 uppercase tracking-wider flex items-center gap-2">
          <BookMarked size={13} className="text-white/40" strokeWidth={1.8} />
          Decision Log
        </h2>
        <Button size="sm" onClick={() => { setCreating(true); setSelected(null); setForm(blankForm) }} className="gap-1.5">
          <Plus size={13} strokeWidth={2.5} />New decision
        </Button>
      </div>

      {creating && (
        <div className="bg-[#141416] border border-white/[0.07] rounded-xl p-5 mb-6 space-y-3">
          <Input autoFocus value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} placeholder="Decision title" />
          <Textarea rows={3} value={form.decision} onChange={(e) => setForm((f) => ({ ...f, decision: e.target.value }))} placeholder="What was decided?" />
          <Textarea rows={2} value={form.rationale} onChange={(e) => setForm((f) => ({ ...f, rationale: e.target.value }))} placeholder="Why? (optional)" />
          <Input type="date" value={form.decided_at} onChange={(e) => setForm((f) => ({ ...f, decided_at: e.target.value }))} />
          <div className="flex gap-2 pt-1">
            <Button size="sm" onClick={handleSave}>Save</Button>
            <Button variant="ghost" size="sm" onClick={() => setCreating(false)}>Cancel</Button>
          </div>
        </div>
      )}

      <div className="bg-[#141416] border border-white/[0.07] rounded-xl divide-y divide-white/[0.05]">
        {decisions.length === 0
          ? <p className="text-center py-16 text-sm text-white/25">No decisions logged yet</p>
          : decisions.map((d) => (
            <div
              key={d.id}
              className="p-4 hover:bg-white/[0.03] cursor-pointer group transition-colors"
              onClick={() => { setSelected(d); setForm({ title: d.title, decision: d.decision, rationale: d.rationale ?? '', decided_at: d.decided_at }); setCreating(true) }}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="font-medium text-white text-[14px]">{d.title}</h3>
                  <p className="text-[12px] text-white/50 mt-1 line-clamp-2 leading-relaxed">{d.decision}</p>
                  <p className="text-[11px] text-white/25 mt-1">{fmtDate(d.decided_at)}</p>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); deleteDecision(d.id) }}
                  className="w-6 h-6 flex items-center justify-center rounded text-white/20 hover:text-red-400 hover:bg-white/[0.06] opacity-0 group-hover:opacity-100 transition-all shrink-0"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          ))}
      </div>
    </div>
  )
}
