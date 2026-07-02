import { useState } from 'react'
import { useLiveQuery } from '@electric-sql/pglite-react'
import { Plus, Trash2, Zap } from 'lucide-react'
import { useProject } from '@/hooks/useProject'
import { saveRetro, deleteRetro } from '@/db/queries/vault'
import type { DbRetrospective } from '@/types/db'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { fmtDate } from '@/lib/utils/dates'

export default function RetroList() {
  const { projectId } = useProject()
  const [creating, setCreating] = useState(false)
  const [selected, setSelected] = useState<DbRetrospective | null>(null)
  const blank = { went_well: '', to_improve: '', actions: '', held_at: new Date().toISOString().split('T')[0] }
  const [form, setForm] = useState(blank)

  const result = useLiveQuery<DbRetrospective>(`SELECT * FROM retrospectives WHERE project_id = $1 ORDER BY held_at DESC`, [projectId ?? ''])
  const retros = result?.rows ?? []

  async function handleSave() {
    if (!projectId) return
    await saveRetro({ id: selected?.id ?? crypto.randomUUID(), project_id: projectId, sprint_id: null, went_well: form.went_well || null, to_improve: form.to_improve || null, actions: form.actions || null, held_at: form.held_at })
    setCreating(false); setSelected(null); setForm(blank)
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-[13px] font-semibold text-white/60 uppercase tracking-wider flex items-center gap-2">
          <Zap size={13} className="text-white/40" strokeWidth={1.8} />
          Retrospectives
        </h2>
        <Button size="sm" onClick={() => { setCreating(true); setSelected(null); setForm(blank) }} className="gap-1.5">
          <Plus size={13} strokeWidth={2.5} />New retro
        </Button>
      </div>

      {creating && (
        <div className="bg-[#141416] border border-white/[0.07] rounded-xl p-5 mb-6 space-y-4">
          <div>
            <label className="block text-[10px] font-medium text-white/30 uppercase tracking-wider mb-1.5">Date held</label>
            <Input type="date" value={form.held_at} onChange={(e) => setForm((f) => ({ ...f, held_at: e.target.value }))} className="max-w-[180px]" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-[11px] text-emerald-400 font-semibold mb-1.5 uppercase tracking-wider">✓ Went well</label>
              <Textarea rows={6} value={form.went_well} onChange={(e) => setForm((f) => ({ ...f, went_well: e.target.value }))} placeholder="What went well this sprint?" />
            </div>
            <div>
              <label className="block text-[11px] text-amber-400 font-semibold mb-1.5 uppercase tracking-wider">△ To improve</label>
              <Textarea rows={6} value={form.to_improve} onChange={(e) => setForm((f) => ({ ...f, to_improve: e.target.value }))} placeholder="What could be better?" />
            </div>
            <div>
              <label className="block text-[11px] text-sky-400 font-semibold mb-1.5 uppercase tracking-wider">→ Action items</label>
              <Textarea rows={6} value={form.actions} onChange={(e) => setForm((f) => ({ ...f, actions: e.target.value }))} placeholder="Concrete next actions" />
            </div>
          </div>
          <div className="flex gap-2 pt-1">
            <Button size="sm" onClick={handleSave}>Save</Button>
            <Button variant="ghost" size="sm" onClick={() => setCreating(false)}>Cancel</Button>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {retros.length === 0
          ? <p className="text-center py-16 text-sm text-white/25">No retrospectives yet</p>
          : retros.map((r) => (
            <div
              key={r.id}
              className="group bg-[#141416] border border-white/[0.07] rounded-xl p-4 hover:border-white/[0.14] hover:bg-[#1a1a1e] transition-all cursor-pointer"
              onClick={() => { setSelected(r); setForm({ went_well: r.went_well ?? '', to_improve: r.to_improve ?? '', actions: r.actions ?? '', held_at: r.held_at }); setCreating(true) }}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-[14px] font-medium text-white">{fmtDate(r.held_at)}</span>
                <button
                  onClick={(e) => { e.stopPropagation(); deleteRetro(r.id) }}
                  className="w-6 h-6 flex items-center justify-center rounded text-white/20 hover:text-red-400 hover:bg-white/[0.06] opacity-0 group-hover:opacity-100 transition-all"
                >
                  <Trash2 size={13} />
                </button>
              </div>
              <div className="grid grid-cols-3 gap-3 text-[12px] text-white/45">
                <div><span className="text-emerald-400/80 font-medium">Went well: </span>{r.went_well?.slice(0, 60) ?? '—'}</div>
                <div><span className="text-amber-400/80 font-medium">Improve: </span>{r.to_improve?.slice(0, 60) ?? '—'}</div>
                <div><span className="text-sky-400/80 font-medium">Actions: </span>{r.actions?.slice(0, 60) ?? '—'}</div>
              </div>
            </div>
          ))}
      </div>
    </div>
  )
}
