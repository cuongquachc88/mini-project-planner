import { useState } from 'react'
import { useLiveQuery } from '@electric-sql/pglite-react'
import { Plus, Trash2, CheckSquare, Check } from 'lucide-react'
import { useProject } from '@/hooks/useProject'
import { saveRunSheet, deleteRunSheet, getRunSheetItems, saveRunSheetItem, deleteRunSheetItem } from '@/db/queries/vault'
import type { DbRunSheet, DbRunSheetItem } from '@/types/db'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { fmtDate } from '@/lib/utils/dates'

function RunSheetDetail({ sheet, onBack }: { sheet: DbRunSheet; onBack: () => void }) {
  const [items, setItems] = useState<DbRunSheetItem[]>([])
  const [newLabel, setNewLabel] = useState('')
  const [loaded, setLoaded] = useState(false)

  if (!loaded) {
    getRunSheetItems(sheet.id).then((rows) => { setItems(rows); setLoaded(true) })
  }

  async function addItem() {
    if (!newLabel.trim()) return
    const item: DbRunSheetItem = { id: crypto.randomUUID(), run_sheet_id: sheet.id, label: newLabel.trim(), notes: null, checked: false, position: items.length }
    await saveRunSheetItem(item)
    setItems((prev) => [...prev, item])
    setNewLabel('')
  }

  async function toggleItem(item: DbRunSheetItem) {
    const updated = { ...item, checked: !item.checked }
    await saveRunSheetItem(updated)
    setItems((prev) => prev.map((i) => i.id === item.id ? updated : i))
  }

  async function removeItem(id: string) {
    await deleteRunSheetItem(id)
    setItems((prev) => prev.filter((i) => i.id !== id))
  }

  const done = items.filter((i) => i.checked).length
  return (
    <div className="p-6">
      <button onClick={onBack} className="text-[13px] text-white/35 hover:text-white/70 mb-5 transition-colors">← Back</button>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-[13px] font-semibold text-white/60 uppercase tracking-wider">{sheet.title}</h2>
          <p className="text-[12px] text-white/30 mt-0.5">{done}/{items.length} completed · {fmtDate(sheet.created_at)}</p>
        </div>
        <div className="h-1.5 w-24 bg-white/[0.08] rounded-full overflow-hidden">
          <div className="h-full bg-emerald-500 rounded-full transition-all duration-300" style={{ width: items.length ? `${(done / items.length) * 100}%` : '0%' }} />
        </div>
      </div>
      <div className="space-y-1 mb-5">
        {items.map((item) => (
          <div key={item.id} className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white/[0.04] group transition-colors">
            <button
              onClick={() => toggleItem(item)}
              className={`w-5 h-5 rounded border flex items-center justify-center transition-all shrink-0 ${item.checked ? 'bg-emerald-500 border-emerald-500' : 'border-white/[0.2] hover:border-white/[0.4]'}`}
            >
              {item.checked && <Check size={11} className="text-white" strokeWidth={3} />}
            </button>
            <span className={`flex-1 text-[13px] ${item.checked ? 'line-through text-white/25' : 'text-white/80'}`}>{item.label}</span>
            <button
              onClick={() => removeItem(item.id)}
              className="w-5 h-5 flex items-center justify-center text-white/20 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
            >
              <Trash2 size={12} />
            </button>
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <Input value={newLabel} onChange={(e) => setNewLabel(e.target.value)} placeholder="Add step…" onKeyDown={(e) => e.key === 'Enter' && addItem()} className="flex-1" />
        <Button size="sm" onClick={addItem} className="gap-1"><Plus size={12} />Add</Button>
      </div>
    </div>
  )
}

export default function RunSheetList() {
  const { projectId } = useProject()
  const [selectedSheet, setSelectedSheet] = useState<DbRunSheet | null>(null)
  const [creating, setCreating] = useState(false)
  const [title, setTitle] = useState('')

  const result = useLiveQuery<DbRunSheet>(`SELECT * FROM run_sheets WHERE project_id = $1 ORDER BY created_at DESC`, [projectId ?? ''])
  const sheets = result?.rows ?? []

  async function handleCreate() {
    if (!title.trim() || !projectId) return
    const sheet = await saveRunSheet({ id: crypto.randomUUID(), project_id: projectId, title: title.trim(), description: null })
    setTitle(''); setCreating(false); setSelectedSheet(sheet)
  }

  if (selectedSheet) return <RunSheetDetail sheet={selectedSheet} onBack={() => setSelectedSheet(null)} />

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-[13px] font-semibold text-white/60 uppercase tracking-wider flex items-center gap-2">
          <CheckSquare size={13} className="text-white/40" strokeWidth={1.8} />
          Run Sheets
        </h2>
        <Button size="sm" onClick={() => setCreating(true)} className="gap-1.5">
          <Plus size={13} strokeWidth={2.5} />New run sheet
        </Button>
      </div>

      {creating && (
        <div className="bg-[#141416] border border-white/[0.07] rounded-xl p-4 mb-5 flex gap-2">
          <Input autoFocus value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Run sheet title" onKeyDown={(e) => e.key === 'Enter' && handleCreate()} className="flex-1" />
          <Button size="sm" onClick={handleCreate}>Create</Button>
          <Button variant="ghost" size="sm" onClick={() => setCreating(false)}>Cancel</Button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {sheets.length === 0
          ? <p className="col-span-2 text-center py-16 text-sm text-white/25">No run sheets yet</p>
          : sheets.map((sheet) => (
            <div
              key={sheet.id}
              className="group bg-[#141416] border border-white/[0.07] rounded-xl p-4 cursor-pointer hover:border-white/[0.14] hover:bg-[#1a1a1e] transition-all"
              onClick={() => setSelectedSheet(sheet)}
            >
              <div className="flex items-center justify-between">
                <h3 className="font-medium text-white text-[14px]">{sheet.title}</h3>
                <button
                  onClick={(e) => { e.stopPropagation(); deleteRunSheet(sheet.id) }}
                  className="w-6 h-6 flex items-center justify-center rounded text-white/20 hover:text-red-400 hover:bg-white/[0.06] opacity-0 group-hover:opacity-100 transition-all"
                >
                  <Trash2 size={13} />
                </button>
              </div>
              <p className="text-[12px] text-white/30 mt-1">{fmtDate(sheet.created_at)}</p>
            </div>
          ))}
      </div>
    </div>
  )
}
