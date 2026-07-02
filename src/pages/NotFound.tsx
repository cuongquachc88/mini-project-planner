import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/Button'

export default function NotFound() {
  const navigate = useNavigate()
  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <div className="text-center">
        <p className="text-6xl font-bold text-slate-700 mb-4">404</p>
        <p className="text-slate-400 mb-6">Page not found</p>
        <Button onClick={() => navigate('/')}>Go home</Button>
      </div>
    </div>
  )
}
