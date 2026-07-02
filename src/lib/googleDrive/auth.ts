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
  localStorage.removeItem('drive_code_verifier')
}

export function isConfigured(): boolean {
  return Boolean(CLIENT_ID)
}

// Generate PKCE code verifier + challenge
async function generatePKCE(): Promise<{ verifier: string; challenge: string }> {
  const array = new Uint8Array(32)
  crypto.getRandomValues(array)
  const verifier = btoa(String.fromCharCode(...array))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')

  const encoder = new TextEncoder()
  const data = encoder.encode(verifier)
  const digest = await crypto.subtle.digest('SHA-256', data)
  const challenge = btoa(String.fromCharCode(...new Uint8Array(digest)))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')

  return { verifier, challenge }
}

export async function initiateOAuthFlow(): Promise<void> {
  if (!CLIENT_ID) throw new Error('VITE_GOOGLE_CLIENT_ID not set')

  const { verifier, challenge } = await generatePKCE()
  localStorage.setItem('drive_code_verifier', verifier)

  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    redirect_uri: REDIRECT_URI,
    response_type: 'code',
    scope: SCOPE,
    code_challenge: challenge,
    code_challenge_method: 'S256',
    access_type: 'offline',
    prompt: 'consent',
  })

  // Use popup to avoid breaking COOP/COEP headers on main window
  const popup = window.open(
    `https://accounts.google.com/o/oauth2/v2/auth?${params}`,
    'google-oauth',
    'width=500,height=600,top=100,left=100',
  )

  if (!popup) throw new Error('Popup blocked. Allow popups for this site.')
}

export async function handleOAuthCallback(code: string): Promise<void> {
  if (!CLIENT_ID) throw new Error('VITE_GOOGLE_CLIENT_ID not set')

  const verifier = localStorage.getItem('drive_code_verifier')
  if (!verifier) throw new Error('No PKCE verifier found')

  const resp = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: CLIENT_ID,
      code,
      code_verifier: verifier,
      grant_type: 'authorization_code',
      redirect_uri: REDIRECT_URI,
    }),
  })

  if (!resp.ok) throw new Error(`Token exchange failed: ${resp.statusText}`)

  const json = await resp.json() as { access_token: string; expires_in: number }
  storeToken({
    access_token: json.access_token,
    expires_at: Date.now() + json.expires_in * 1000,
  })
  localStorage.removeItem('drive_code_verifier')
}
