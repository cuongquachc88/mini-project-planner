import { createContext, useContext } from 'react'
import type { PGliteWithLive } from '@electric-sql/pglite/live'

export const DbContext = createContext<PGliteWithLive | null>(null)

export function useDb(): PGliteWithLive {
  const db = useContext(DbContext)
  if (!db) throw new Error('useDb must be used inside DbContext.Provider')
  return db
}
