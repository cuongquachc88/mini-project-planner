import { createBrowserRouter } from 'react-router-dom'
import Home from '@/pages/Home'
import Profile from '@/pages/Profile'
import OAuthCallback from '@/pages/OAuthCallback'
import ProjectLayout from '@/pages/ProjectLayout'
import Board from '@/pages/Board'
import Backlog from '@/pages/Backlog'
import Epics from '@/pages/Epics'
import Reports from '@/pages/Reports'
import Vault from '@/pages/Vault'
import Settings from '@/pages/Settings'
import NotFound from '@/pages/NotFound'

export const router = createBrowserRouter([
  { path: '/', element: <Home /> },
  { path: '/profile', element: <Profile /> },
  { path: '/oauth-callback', element: <OAuthCallback /> },
  {
    path: '/projects/:projectId',
    element: <ProjectLayout />,
    children: [
      { index: true, element: <Board /> },
      { path: 'board', element: <Board /> },
      { path: 'backlog', element: <Backlog /> },
      { path: 'epics', element: <Epics /> },
      { path: 'reports', element: <Reports /> },
      { path: 'vault/*', element: <Vault /> },
      { path: 'settings', element: <Settings /> },
    ],
  },
  { path: '*', element: <NotFound /> },
])
