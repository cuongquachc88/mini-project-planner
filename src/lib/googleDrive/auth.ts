const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined
const REDIRECT_URI = `${window.location.origin}/oauth-callback`
const SCOPE = 'https://www.googleapis.com/auth/drive.appdata'

interface TokenData {
  access_token: string
  expires_at: number
}

export function getStoredToken(): TokenData | null {
  try {
    const raw = localStorage.getItem('drive_token')
    if (!raw) return null
    const data = JSON.parse(raw) as TokenData
    if (Date.now() > data.expires_at) {
      localStorage.removeItem('drive_token')
      return null
    }
    return data
  } catch {
    return null
  }
}

export function storeToken(token: TokenData): void {
  localStorage.setItem('drive_token', JSON.stringify(token))
}

export function clearToken(): void {
  localStorage.removeItem('drive_token')
}

export function isConfigured(): boolean {
  return Boolean(CLIENT_ID)
}

export async function initiateOAuthFlow(): Promise<void> {
  if (!CLIENT_ID) throw new Error('VITE_GOOGLE_CLIENT_ID not set')

  localStorage.setItem('drive_oauth_return', window.location.pathname)

  // Implicit flow — token returned in URL fragment, no secret needed for PWA
  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    redirect_uri: REDIRECT_URI,
    response_type: 'token',
    scope: SCOPE,
    prompt: 'consent',
  })

  window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?${params}`
}

// Called from OAuthCallback — parse token from URL hash fragment
export function handleOAuthCallback(): void {
  const hash = new URLSearchParams(window.location.hash.slice(1))
  const access_token = hash.get('access_token')
  const expires_in = hash.get('expires_in')
  const error = hash.get('error')

  if (error) throw new Error(`Google OAuth error: ${error}`)
  if (!access_token) throw new Error('No access token in callback')

  storeToken({
    access_token,
    expires_at: Date.now() + Number(expires_in ?? 3600) * 1000,
  })
}
