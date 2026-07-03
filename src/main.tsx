import React, { useState, useEffect } from 'react'
import ReactDOM from 'react-dom/client'
import { PGliteProvider } from '@electric-sql/pglite-react'
import { RouterProvider } from 'react-router-dom'
import { initDb } from '@/db/client'
import { DbContext } from '@/hooks/useDb'
import { useStore } from '@/store'
import { router } from './App'
import './index.css'
import type { PGliteWithLive } from '@electric-sql/pglite/live'

function App({ db }: { db: PGliteWithLive }) {
  const [pinHash, setPinHash] = useState<string | null | 'loading'>('loading')
  const { locked, unlock, setCurrentUser, currentUser } = useStore()

  useEffect(() => {
    async function boot() {
      setPinHash(null)
      unlock()
    }
    boot()
  }, [])

  if (pinHash === 'loading') return null

  return (
    <PGliteProvider db={db}>
      <DbContext.Provider value={db}>
        <RouterProvider router={router} />
      </DbContext.Provider>
    </PGliteProvider>
  )
}

async function bootstrap() {
  const db = await initDb()

  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <App db={db} />
    </React.StrictMode>,
  )
}

bootstrap().catch(console.error)
