import React, { useState, useEffect } from 'react'
import ReactDOM from 'react-dom/client'
import { PGliteProvider } from '@electric-sql/pglite-react'
import { RouterProvider } from 'react-router-dom'
import { initDb } from '@/db/client'
import { DbContext } from '@/hooks/useDb'
import { getAppMeta, getUserById } from '@/db/queries/users'
import { PinLock } from '@/components/PinLock'
import { useStore } from '@/store'
import { router } from './App'
import './index.css'
import type { PGliteWithLive } from '@electric-sql/pglite/live'

function App({ db }: { db: PGliteWithLive }) {
  const [pinHash, setPinHash] = useState<string | null | 'loading'>('loading')
  const { locked, unlock, setCurrentUser } = useStore()

  useEffect(() => {
    async function boot() {
      const [h, uid] = await Promise.all([
        getAppMeta('pin_hash'),
        getAppMeta('active_user_id'),
      ])
      setPinHash(h)
      if (!h) unlock()
      if (uid) {
        const user = await getUserById(uid)
        if (user) setCurrentUser(user)
      }
    }
    boot()
  }, [])

  if (pinHash === 'loading') return null

  if (pinHash && locked) {
    return <PinLock pinHash={pinHash} onUnlock={unlock} />
  }

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
