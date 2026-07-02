import { exportDbAsSql, restoreFromSql } from '@/db/client'
import { setAppMeta, getAppMeta } from '@/db/queries/users'
import { findFile, uploadFile, downloadFile } from './driveApi'
import type { PGliteWithLive } from '@electric-sql/pglite/live'

const BACKUP_FILENAME = 'planner-backup.sql'

export async function exportAndUpload(_db: PGliteWithLive): Promise<string> {
  const sql = await exportDbAsSql()
  const existing = await findFile(BACKUP_FILENAME)
  const file = await uploadFile(sql, BACKUP_FILENAME, existing?.id)
  const now = new Date().toISOString()
  await setAppMeta('last_drive_sync', now)
  await setAppMeta('drive_file_id', file.id)
  return now
}

export async function downloadAndRestore(_db: PGliteWithLive): Promise<void> {
  const fileId = await getAppMeta('drive_file_id') ?? undefined
  let existing = fileId ? { id: fileId } : await findFile(BACKUP_FILENAME)
  if (!existing) throw new Error('No backup found in Google Drive')

  const sql = await downloadFile(existing.id)
  await restoreFromSql(sql)
  await setAppMeta('last_drive_sync', new Date().toISOString())
  // Reload the app so all live queries re-hydrate from new data
  window.location.reload()
}

export async function autoSyncIfOnline(db: PGliteWithLive): Promise<string | null> {
  if (!navigator.onLine) return null
  return exportAndUpload(db)
}
