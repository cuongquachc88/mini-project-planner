import { useState } from 'react'
import { useLiveQuery } from '@electric-sql/pglite-react'
import { Plus, Trash2, DollarSign } from 'lucide-react'
import { useProject } from '@/hooks/useProject'
import { saveCost, deleteCost } from '@/db/queries/vault'
import type { DbCost } from '@/types/db'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

const CATEGORIES = ['saas', 'infra', 'tooling', 'other'] as const
const CADENCES = ['monthly', 'annual', 'one-off'] as const

export default function CostList() {
  const { projectId } = useProject()
  const [creating, setCreating] = useState(false)
  const blank = { name: '', category: 'saas' as const, cadence: 'monthly' as const, amount: '', currency: 'USD', budget: '' }
  const [form, setForm] = useState(blank)

  const result = useLiveQuery<DbCost>(`SELECT * FROM costs WHERE project_id = $1 ORDER BY name`, [projectId ?? ''])
  const costs = result?.rows ?? []

  const totalMonthly = costs
    .filter((c) => c.active)
    .reduce((sum, c) => {
      const amt = Number(c.amount)
      return sum + (c.cadence === 'monthly' ? amt : c.cadence === 'annual' ? amt / 12 : 0)
    }, 0)

  async function handleSave() {
    if (!form.name.trim() || !projectId) return
    await saveCost({ id: crypto.randomUUID(), project_id: projectId, name: form.name, category: form.category, cadence: form.cadence, amount: Number(form.amount) || 0, currency: form.currency, budget: form.budget ? Number(form.budget) : null, active: true, notes: null, start_date: null })
    setForm(blank); setCreating(false)
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-[13px] font-semibold text-white/60 uppercase tracking-wider flex items-center gap-2">
          <DollarSign size={13} className="text-white/40" strokeWidth={1.8} />
          Costs & Subscriptions
        </h2>
        <Button size="sm" onClick={() => setCreating(true)} className="gap-1.5">
          <Plus size={13} strokeWidth={2.5} />Add cost
        </Button>
      </div>

      {/* Summary bar */}
      <div className="bg-[#141416] border border-white/[0.07] rounded-xl px-5 py-4 mb-6 flex items-center gap-8">
        <div>
          <p className="text-[11px] text-white/30 uppercase tracking-wider mb-0.5">Monthly total</p>
          <p className="text-[22px] font-bold text-white">${totalMonthly.toFixed(2)}</p>
        </div>
        <div className="w-px h-8 bg-white/[0.07]" />
        <div>
          <p className="text-[11px] text-white/30 uppercase tracking-wider mb-0.5">Annual est.</p>
          <p className="text-[22px] font-bold text-white">${(totalMonthly * 12).toFixed(2)}</p>
        </div>
      </div>

      {creating && (
        <div className="bg-[#141416] border border-white/[0.07] rounded-xl p-5 mb-6 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-medium text-white/30 uppercase tracking-wider block mb-1.5">Name</label>
              <Input autoFocus value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Vercel, GitHub, etc." />
            </div>
            <div>
              <label className="text-[10px] font-medium text-white/30 uppercase tracking-wider block mb-1.5">Amount</label>
              <Input type="number" value={form.amount} onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))} placeholder="0.00" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-medium text-white/30 uppercase tracking-wider block mb-1.5">Category</label>
              <select className="input w-full" value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value as typeof form.category }))}>
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-medium text-white/30 uppercase tracking-wider block mb-1.5">Cadence</label>
              <select className="input w-full" value={form.cadence} onChange={(e) => setForm((f) => ({ ...f, cadence: e.target.value as typeof form.cadence }))}>
                {CADENCES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div className="flex gap-2 pt-1">
            <Button size="sm" onClick={handleSave}>Save</Button>
            <Button variant="ghost" size="sm" onClick={() => setCreating(false)}>Cancel</Button>
          </div>
        </div>
      )}

      <div className="bg-[#141416] border border-white/[0.07] rounded-xl divide-y divide-white/[0.05]">
        {costs.length === 0
          ? <p className="text-center py-16 text-sm text-white/25">No costs tracked yet</p>
          : costs.map((cost) => (
            <div key={cost.id} className="flex items-center gap-3 px-4 py-3 group hover:bg-white/[0.02] transition-colors">
              <div className="flex-1 min-w-0">
                <p className="text-[14px] font-medium text-white">{cost.name}</p>
                <p className="text-[12px] text-white/35 capitalize mt-0.5">{cost.category} · {cost.cadence}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-[14px] font-semibold text-white">${Number(cost.amount).toFixed(2)}</p>
                {cost.cadence === 'annual' && <p className="text-[11px] text-white/30">${(Number(cost.amount) / 12).toFixed(2)}/mo</p>}
              </div>
              <button
                onClick={() => deleteCost(cost.id)}
                className="w-6 h-6 flex items-center justify-center rounded text-white/20 hover:text-red-400 hover:bg-white/[0.06] opacity-0 group-hover:opacity-100 transition-all ml-1"
              >
                <Trash2 size={13} />
              </button>
            </div>
          ))}
      </div>
    </div>
  )
}
