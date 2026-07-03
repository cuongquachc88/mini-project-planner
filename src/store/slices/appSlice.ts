import type { DbUser } from '@/types/db'

export interface AppSlice {
  currentUser: DbUser | null
  isDbReady: boolean
  setCurrentUser: (user: DbUser | null) => void
  setDbReady: (ready: boolean) => void
  logout: () => Promise<void>
}

export const createAppSlice = (set: (fn: (s: AppSlice) => Partial<AppSlice>) => void): AppSlice => ({
  currentUser: null,
  isDbReady: false,
  setCurrentUser: (user) => set(() => ({ currentUser: user })),
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
