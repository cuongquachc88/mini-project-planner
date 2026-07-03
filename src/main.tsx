import React, { useState, useEffect } from 'react'
import ReactDOM from 'react-dom/client'
import { PGliteProvider } from '@electric-sql/pglite-react'
import { RouterProvider } from 'react-router-dom'
import { initDb } from '@/db/client'
import { DbContext } from '@/hooks/useDb'
import { getAppMeta, getUserById } from '@/db/queries/users'
import { useStore } from '@/store'
import { router } from './App'
import './index.css'
import type { PGliteWithLive } from '@electric-sql/pglite/live'

function App({ db }: { db: PGliteWithLive }) {
  const [ready, setReady] = useState(false)
  const { setCurrentUser, setSessionReady } = useStore()

  useEffect(() => {
    async function boot() {
      const uid = await getAppMeta('active_user_id')
      if (uid) {
        const user = await getUserById(uid)
        if (user) setCurrentUser(user)
      }
      setSessionReady()
      setReady(true)
    }
    boot()
  }, [])

  if (!ready) return null

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
