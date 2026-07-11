import { useState } from 'react'
import { Cloud, CloudOff, RefreshCw, AlertCircle, Check, Download } from 'lucide-react'
import { useGoogleDrive } from '@/hooks/useGoogleDrive'
import { useStore } from '@/store'
import { fmtRelative } from '@/lib/utils/dates'
import { cn } from '@/lib/utils/cn'

export function SyncStatusBar() {
  const { isDriveConnected, syncStatus, lastSyncedAt, syncError } = useStore()
  const { sync, restore, connect, disconnect, isConfigured } = useGoogleDrive()
  const [restoring, setRestoring] = useState(false)

  if (!isConfigured) return null

  async function handleRestore() {
    if (!confirm('Pull from Drive? This will overwrite all local data and reload the app.')) return
    setRestoring(true)
    try {
      await restore()
    } catch {
      setRestoring(false)
    }
  }

  return (
    <div className="flex items-center gap-2 text-[11px]">
      {isDriveConnected ? (
        <>
          {syncStatus === 'syncing'  && <RefreshCw size={12} className="animate-spin text-violet-400" />}
          {syncStatus === 'success'  && <Check size={12} className="text-emerald-400" />}
          {syncStatus === 'error'    && <AlertCircle size={12} className="text-red-400" />}
          {syncStatus === 'idle'     && <Cloud size={12} className="text-emerald-400/70" />}

          <span className={cn('text-white/30 max-w-[200px] truncate', syncStatus === 'error' && 'text-red-400')}
            title={syncStatus === 'error' ? (syncError ?? 'Sync failed') : undefined}>
            {syncStatus === 'syncing'  ? 'Syncing…'
             : syncStatus === 'error'  ? (syncError ?? 'Sync failed')
             : lastSyncedAt           ? `Synced ${fmtRelative(lastSyncedAt)}`
             : 'Connected'}
          </span>

          <button onClick={sync} disabled={syncStatus === 'syncing'}
            className="text-white/20 hover:text-white/50 transition-colors disabled:opacity-30" title="Push to Drive">
            <RefreshCw size={11} />
          </button>

          <button onClick={handleRestore} disabled={restoring || syncStatus === 'syncing'}
            className="text-white/20 hover:text-blue-400 transition-colors disabled:opacity-30" title="Pull from Drive">
            {restoring ? <RefreshCw size={11} className="animate-spin" /> : <Download size={11} />}
          </button>

          <button onClick={disconnect}
            className="text-white/20 hover:text-red-400 transition-colors" title="Disconnect Drive">
            <CloudOff size={11} />
          </button>
        </>
      ) : (
        <button onClick={connect}
          className="flex items-center gap-1.5 text-white/25 hover:text-violet-400 transition-colors">
          <CloudOff size={12} /><span>Connect Drive</span>
        </button>
      )}
    </div>
  )
}
