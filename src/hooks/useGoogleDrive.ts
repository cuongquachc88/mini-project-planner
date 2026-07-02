import { useEffect, useCallback, useRef } from 'react'
import { useStore } from '@/store'
import { useDb } from './useDb'
import { getStoredToken, isConfigured, initiateOAuthFlow, clearToken } from '@/lib/googleDrive/auth'
import { exportAndUpload, downloadAndRestore } from '@/lib/googleDrive/sync'
import { getAppMeta } from '@/db/queries/users'

const AUTO_SYNC_INTERVAL = 15 * 60 * 1000 // 15 min

export function useGoogleDrive() {
  const db = useDb()
  const { setSyncStatus, setLastSyncedAt, setSyncError, setDriveConnected, isDriveConnected, syncStatus } = useStore()
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Check connection on mount
  useEffect(() => {
    const token = getStoredToken()
    const configured = isConfigured()
    setDriveConnected(Boolean(token && configured))

    // Load last sync time from DB
    getAppMeta('last_drive_sync').then((ts) => {
      if (ts) setLastSyncedAt(ts)
    })
  }, [setDriveConnected, setLastSyncedAt])

  const sync = useCallback(async () => {
    if (!isDriveConnected) return
    setSyncStatus('syncing')
    setSyncError(null)
    try {
      const ts = await exportAndUpload(db)
      setLastSyncedAt(ts)
      setSyncStatus('success')
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      setSyncError(msg)
      setSyncStatus('error')
    }
  }, [db, isDriveConnected, setSyncStatus, setSyncError, setLastSyncedAt])

  const restore = useCallback(async () => {
    setSyncStatus('syncing')
    try {
      await downloadAndRestore(db)
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      setSyncError(msg)
      setSyncStatus('error')
    }
  }, [db, setSyncStatus, setSyncError])

  const connect = useCallback(async () => {
    await initiateOAuthFlow()
  }, [])

  const disconnect = useCallback(() => {
    clearToken()
    setDriveConnected(false)
    setSyncStatus('idle')
  }, [setDriveConnected, setSyncStatus])

  // Auto-sync every 15 min when connected
  useEffect(() => {
    if (intervalRef.current) clearInterval(intervalRef.current)
    if (!isDriveConnected) return

    intervalRef.current = setInterval(() => {
      if (navigator.onLine) sync()
    }, AUTO_SYNC_INTERVAL)

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [isDriveConnected, sync])

  return {
    isConfigured: isConfigured(),
    isDriveConnected,
    syncStatus,
    sync,
    restore,
    connect,
    disconnect,
  }
}
