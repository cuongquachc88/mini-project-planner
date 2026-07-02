export type SyncStatus = 'idle' | 'syncing' | 'success' | 'error'

export interface SyncSlice {
  syncStatus: SyncStatus
  lastSyncedAt: string | null
  syncError: string | null
  isDriveConnected: boolean
  setSyncStatus: (status: SyncStatus) => void
  setLastSyncedAt: (ts: string) => void
  setSyncError: (err: string | null) => void
  setDriveConnected: (connected: boolean) => void
}

export const createSyncSlice = (set: (fn: (s: SyncSlice) => Partial<SyncSlice>) => void): SyncSlice => ({
  syncStatus: 'idle',
  lastSyncedAt: null,
  syncError: null,
  isDriveConnected: false,
  setSyncStatus: (status) => set(() => ({ syncStatus: status })),
  setLastSyncedAt: (ts) => set(() => ({ lastSyncedAt: ts })),
  setSyncError: (err) => set(() => ({ syncError: err })),
  setDriveConnected: (connected) => set(() => ({ isDriveConnected: connected })),
})
