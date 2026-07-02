import { RefreshCw, X } from 'lucide-react'
import { useState } from 'react'
import { usePWA } from '@/hooks/usePWA'
import { Button } from './ui/Button'

export function UpdatePrompt() {
  const { needRefresh, updateApp } = usePWA()
  const [dismissed, setDismissed] = useState(false)

  if (!needRefresh || dismissed) return null

  return (
    <div className="fixed top-4 right-4 z-50 bg-slate-800 border border-brand-500/50 rounded-xl shadow-2xl px-5 py-3 flex items-center gap-4 max-w-xs">
      <RefreshCw size={16} className="text-brand-400 shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-200">Update available</p>
        <p className="text-xs text-slate-500">Reload to get the latest version</p>
      </div>
      <Button size="sm" onClick={updateApp}>Reload</Button>
      <button onClick={() => setDismissed(true)} className="text-slate-600 hover:text-slate-300 transition-colors">
        <X size={14} />
      </button>
    </div>
  )
}
