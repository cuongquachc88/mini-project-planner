import type { DbUser } from '@/types/db'

export interface AppSlice {
  currentUser: DbUser | null
  sessionReady: boolean          // true after main.tsx finishes loading session from DB
  isDbReady: boolean
  setCurrentUser: (user: DbUser | null) => void
  setSessionReady: () => void
  setDbReady: (ready: boolean) => void
  logout: () => Promise<void>
}

export const createAppSlice = (set: (fn: (s: AppSlice) => Partial<AppSlice>) => void): AppSlice => ({
  currentUser: null,
  sessionReady: false,
  isDbReady: false,
  setCurrentUser: (user) => set(() => ({ currentUser: user })),
  setSessionReady: () => set(() => ({ sessionReady: true })),
  setDbReady: (ready) => set(() => ({ isDbReady: ready })),
  logout: async () => {
    const { setAppMeta } = await import('@/db/queries/users')
    await Promise.all([
      setAppMeta('active_user_id', ''),
      setAppMeta('pin_hash', ''),
    ])
    set(() => ({ currentUser: null }))
  },
})
