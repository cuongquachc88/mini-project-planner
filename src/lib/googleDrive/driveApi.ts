import { getStoredToken } from './auth'

const BASE = 'https://www.googleapis.com'

function authHeader(): Record<string, string> {
  const token = getStoredToken()
  if (!token) throw new Error('Not authenticated with Google Drive')
  return { Authorization: `Bearer ${token.access_token}` }
}

export interface DriveFile {
  id: string
  name: string
  modifiedTime: string
}

export async function findFile(name: string): Promise<DriveFile | null> {
  const params = new URLSearchParams({
    spaces: 'appDataFolder',
    fields: 'files(id,name,modifiedTime)',
    q: `name = '${name}'`,
  })
  const resp = await fetch(`${BASE}/drive/v3/files?${params}`, { headers: authHeader() })
  if (!resp.ok) {
    const body = await resp.json().catch(() => ({})) as { error?: { message?: string } }
    throw new Error(`Drive list failed (${resp.status}): ${body?.error?.message ?? resp.statusText}`)
  }
  const json = await resp.json() as { files: DriveFile[] }
  return json.files[0] ?? null
}

export async function uploadFile(content: string, name: string, existingFileId?: string): Promise<DriveFile> {
  const metadata = JSON.stringify({
    name,
    ...(existingFileId ? {} : { parents: ['appDataFolder'] }),
  })

  const form = new FormData()
  form.append('metadata', new Blob([metadata], { type: 'application/json' }))
  form.append('file', new Blob([content], { type: 'text/plain' }))

  const url = existingFileId
    ? `${BASE}/upload/drive/v3/files/${existingFileId}?uploadType=multipart&fields=id,name,modifiedTime`
    : `${BASE}/upload/drive/v3/files?uploadType=multipart&fields=id,name,modifiedTime`

  const resp = await fetch(url, {
    method: existingFileId ? 'PATCH' : 'POST',
    headers: authHeader(),
    body: form,
  })

  if (!resp.ok) {
    const body = await resp.json().catch(() => ({})) as { error?: { message?: string } }
    throw new Error(`Drive upload failed (${resp.status}): ${body?.error?.message ?? resp.statusText}`)
  }
  return resp.json() as Promise<DriveFile>
}

export async function downloadFile(fileId: string): Promise<string> {
  const resp = await fetch(`${BASE}/drive/v3/files/${fileId}?alt=media`, { headers: authHeader() })
  if (!resp.ok) {
    const body = await resp.json().catch(() => ({})) as { error?: { message?: string } }
    throw new Error(`Drive download failed (${resp.status}): ${body?.error?.message ?? resp.statusText}`)
  }
  return resp.text()
}

export async function deleteFile(fileId: string): Promise<void> {
  const resp = await fetch(`${BASE}/drive/v3/files/${fileId}`, {
    method: 'DELETE',
    headers: authHeader(),
  })
  if (!resp.ok && resp.status !== 404) throw new Error(`Drive delete failed: ${resp.statusText}`)
}
