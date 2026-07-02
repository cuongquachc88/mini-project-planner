import { Outlet } from 'react-router-dom'
import { Sidebar } from '@/components/layout/Sidebar'
import { TopBar } from '@/components/layout/TopBar'
import { PWAInstallBanner } from '@/components/PWAInstallBanner'
import { UpdatePrompt } from '@/components/UpdatePrompt'

export default function ProjectLayout() {
  return (
    <div className="flex flex-col h-screen overflow-hidden bg-slate-950">
      <TopBar />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-auto bg-slate-950">
          <Outlet />
        </main>
      </div>
      <PWAInstallBanner />
      <UpdatePrompt />
    </div>
  )
}
