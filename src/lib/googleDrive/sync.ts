import { exportDbAsJson, mergeAndApplySnapshot, type DbSnapshot } from '@/db/client'
import { setAppMeta, getAppMeta } from '@/db/queries/users'
import { findFile, uploadFile, downloadFile } from './driveApi'
import type { PGliteWithLive } from '@electric-sql/pglite/live'

const BACKUP_FILENAME = 'planner-backup.json'

async function fetchRemoteSnapshot(): Promise<{ snapshot: DbSnapshot; fileId: string } | null> {
  const storedId = await getAppMeta('drive_file_id') ?? undefined
  const file = storedId ? { id: storedId } : await findFile(BACKUP_FILENAME)
  if (!file) return null
  const text = await downloadFile(file.id)
  const snapshot = JSON.parse(text) as DbSnapshot
  return { snapshot, fileId: file.id }
}

// Push local → Drive (merge first so Drive always has the union)
export async function exportAndUpload(_db: PGliteWithLive): Promise<string> {
  // Fetch remote and merge into local before uploading
  const remote = await fetchRemoteSnapshot()
  if (remote) {
    await mergeAndApplySnapshot(remote.snapshot)
  }

  // Now export the (merged) local state and upload
  const snapshot = await exportDbAsJson()
  const json = JSON.stringify(snapshot)

  const existingId = remote?.fileId ?? (await getAppMeta('drive_file_id')) ?? undefined
  const existingFile = existingId ? { id: existingId } : await findFile(BACKUP_FILENAME)
  const file = await uploadFile(json, BACKUP_FILENAME, existingFile?.id)

  const now = new Date().toISOString()
  await setAppMeta('last_drive_sync', now)
  await setAppMeta('drive_file_id', file.id)
  return now
}

// Pull Drive → local (merge, don't overwrite)
export async function downloadAndRestore(_db: PGliteWithLive): Promise<void> {
  const remote = await fetchRemoteSnapshot()
  if (!remote) throw new Error('No backup found in Google Drive')

  await mergeAndApplySnapshot(remote.snapshot)
  await setAppMeta('drive_file_id', remote.fileId)
  await setAppMeta('last_drive_sync', new Date().toISOString())
}

export async function autoSyncIfOnline(db: PGliteWithLive): Promise<string | null> {
  if (!navigator.onLine) return null
  return exportAndUpload(db)
}
