import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { handleOAuthCallback } from '@/lib/googleDrive/auth'
import { useStore } from '@/store'

export default function OAuthCallback() {
  const navigate = useNavigate()
  const { setDriveConnected } = useStore()
  const [error, setError] = useState('')

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const code = params.get('code')
    const err = params.get('error')

    if (err) {
      setError(`Google OAuth error: ${err}`)
      return
    }

    if (!code) {
      setError('No authorization code received')
      return
    }

    handleOAuthCallback(code)
      .then(() => {
        setDriveConnected(true)
        const returnTo = localStorage.getItem('drive_oauth_return') || '/profile'
        localStorage.removeItem('drive_oauth_return')
        navigate(returnTo, { replace: true })
      })
      .catch((e: Error) => {
        setError(e.message)
      })
  }, [navigate, setDriveConnected])

  if (error) {
    return (
      <div className="min-h-screen bg-[#0d0d0f] flex items-center justify-center">
        <div className="bg-[#141416] border border-white/[0.07] rounded-2xl p-6 max-w-sm w-full text-center space-y-3">
          <p className="text-red-400 font-medium">Drive connection failed</p>
          <p className="text-sm text-white/40">{error}</p>
          <button onClick={() => navigate('/profile')} className="text-sm text-white/40 hover:text-white/70 transition-colors">Go back</button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0d0d0f] flex items-center justify-center">
      <div className="text-center space-y-3">
        <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-sm text-white/40">Connecting Google Drive…</p>
      </div>
    </div>
  )
}
