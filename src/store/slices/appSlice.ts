import type { DbUser } from '@/types/db'

// Store on window so HMR module duplication doesn't create separate instances
const w = window as Window & { __planner_unlocked?: boolean }
const getUnlockedRaw = () => w.__planner_unlocked === true
const setUnlockedRaw = (v: boolean) => { w.__planner_unlocked = v }

export interface AppSlice {
  currentUser: DbUser | null
  sessionReady: boolean
  isUnlocked: boolean
  isDbReady: boolean
  setCurrentUser: (user: DbUser | null) => void
  setSessionReady: () => void
  setDbReady: (ready: boolean) => void
  unlock: () => void
  logout: () => void
}

export const createAppSlice = (set: (fn: (s: AppSlice) => Partial<AppSlice>) => void): AppSlice => ({
  currentUser: null,
  sessionReady: false,
  isUnlocked: false,
  isDbReady: false,
  setCurrentUser: (user) => set(() => ({ currentUser: user })),
  setSessionReady: () => set(() => ({ sessionReady: true })),
  setDbReady: (ready) => set(() => ({ isDbReady: ready })),
  unlock: () => { setUnlockedRaw(true); set(() => ({ isUnlocked: true })) },
  logout: () => { setUnlockedRaw(false); set(() => ({ isUnlocked: false })) },
})

export const getUnlocked = getUnlockedRaw
