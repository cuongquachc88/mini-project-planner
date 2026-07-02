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
        // If opened as popup, close it and refresh opener
        if (window.opener) {
          window.opener.postMessage({ type: 'DRIVE_AUTH_SUCCESS' }, window.location.origin)
          window.close()
        } else {
          navigate('/profile')
        }
      })
      .catch((e: Error) => {
        setError(e.message)
      })
  }, [navigate, setDriveConnected])

  if (error) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="card p-6 max-w-sm text-center space-y-3">
          <p className="text-red-400 font-medium">Drive connection failed</p>
          <p className="text-sm text-slate-400">{error}</p>
          <button onClick={() => navigate('/profile')} className="btn-ghost text-sm">Go back</button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <div className="text-center space-y-3">
        <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-sm text-slate-400">Connecting Google Drive…</p>
      </div>
    </div>
  )
}
