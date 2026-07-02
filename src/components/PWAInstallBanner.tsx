import { Download, X } from 'lucide-react'
import { useState } from 'react'
import { usePWA } from '@/hooks/usePWA'
import { Button } from './ui/Button'

export function PWAInstallBanner() {
  const { canInstall, install } = usePWA()
  const [dismissed, setDismissed] = useState(false)

  if (!canInstall || dismissed) return null

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 bg-slate-800 border border-slate-600 rounded-xl shadow-2xl px-5 py-3 flex items-center gap-4 max-w-sm w-full">
      <Download size={18} className="text-brand-400 shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-200">Install Planner</p>
        <p className="text-xs text-slate-500">Use offline, like a native app</p>
      </div>
      <Button size="sm" onClick={install}>Install</Button>
      <button onClick={() => setDismissed(true)} className="text-slate-600 hover:text-slate-300 transition-colors">
        <X size={14} />
      </button>
    </div>
  )
}
