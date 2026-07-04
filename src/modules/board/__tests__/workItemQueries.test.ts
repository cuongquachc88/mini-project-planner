import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/db/client', () => ({ getDb: vi.fn() }))

import { getDb } from '@/db/client'
import {
  getSubtasks,
  addAttachment,
  deleteAttachment,
  updateWorkItem,
  getAttachments,
  getAttachmentData,
} from '../../../db/queries/workItems'

describe('workItem queries', () => {
  let mockDb: { query: ReturnType<typeof vi.fn> }

  beforeEach(() => {
    mockDb = { query: vi.fn().mockResolvedValue({ rows: [] }) }
    ;(getDb as ReturnType<typeof vi.fn>).mockReturnValue(mockDb)
  })

  // ── getSubtasks ──────────────────────────────────────────
  describe('getSubtasks', () => {
    it('queries work_items by parent_id', async () => {
      const parentId = 'parent-123'
      mockDb.query.mockResolvedValueOnce({ rows: [] })

      await getSubtasks(parentId)

      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining('WHERE parent_id = $1'),
        [parentId],
      )
    })

    it('returns rows from query result', async () => {
      const fakeSubtask = { id: 'sub-1', title: 'Fix bug', parent_id: 'parent-123' }
      mockDb.query.mockResolvedValueOnce({ rows: [fakeSubtask] })

      const result = await getSubtasks('parent-123')

      expect(result).toEqual([fakeSubtask])
    })
  })

  // ── addAttachment ────────────────────────────────────────
  describe('addAttachment', () => {
    it('inserts attachment and returns metadata without data field', async () => {
      const meta = { id: 'att-1', work_item_id: 'wi-1', filename: 'spec.pdf', mime_type: 'application/pdf', size_bytes: 1024, created_at: '2024-01-01' }
      mockDb.query.mockResolvedValueOnce({ rows: [meta] })

      const result = await addAttachment('wi-1', 'spec.pdf', 'application/pdf', 'base64data==')

      const [sql, params] = mockDb.query.mock.calls[0]
      expect(sql).toContain('INSERT INTO work_item_attachments')
      expect(params[1]).toBe('wi-1')
      expect(params[2]).toBe('spec.pdf')
      expect(params[3]).toBe('application/pdf')
      expect(params[5]).toBe('base64data==')
      expect(result).toEqual(meta)
    })

    it('calculates size_bytes from base64 length', async () => {
      mockDb.query.mockResolvedValueOnce({ rows: [{}] })
      const base64 = 'A'.repeat(400) // 400 chars → ~300 bytes
      await addAttachment('wi-1', 'img.png', 'image/png', base64)

      const params = mockDb.query.mock.calls[0][1]
      expect(params[4]).toBe(Math.round(400 * 0.75)) // 300
    })
  })

  // ── deleteAttachment ─────────────────────────────────────
  describe('deleteAttachment', () => {
    it('deletes by id', async () => {
      await deleteAttachment('att-99')

      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining('DELETE FROM work_item_attachments'),
        ['att-99'],
      )
    })
  })

  // ── getAttachments ───────────────────────────────────────
  describe('getAttachments', () => {
    it('does not select data column', async () => {
      mockDb.query.mockResolvedValueOnce({ rows: [] })
      await getAttachments('wi-1')

      const [sql] = mockDb.query.mock.calls[0]
      expect(sql).not.toContain(', data')
      expect(sql).toContain('FROM work_item_attachments')
    })
  })

  // ── getAttachmentData ─────────────────────────────────────
  describe('getAttachmentData', () => {
    it('returns base64 data string', async () => {
      mockDb.query.mockResolvedValueOnce({ rows: [{ data: 'abc123==' }] })
      const result = await getAttachmentData('att-1')
      expect(result).toBe('abc123==')
    })

    it('returns null when not found', async () => {
      mockDb.query.mockResolvedValueOnce({ rows: [] })
      const result = await getAttachmentData('missing')
      expect(result).toBeNull()
    })
  })

  // ── updateWorkItem — new fields ──────────────────────────
  describe('updateWorkItem', () => {
    it('includes acceptance_criteria in UPDATE', async () => {
      // updateWorkItem calls query twice: once to build SET, once to execute
      // The actual implementation builds the SET clause dynamically
      mockDb.query.mockResolvedValueOnce({ rows: [] })

      await updateWorkItem('wi-1', { acceptance_criteria: 'Must pass all tests' })

      const [sql, params] = mockDb.query.mock.calls[0]
      expect(sql).toContain('acceptance_criteria')
      expect(params).toContain('Must pass all tests')
    })

    it('includes tech_notes in UPDATE', async () => {
      mockDb.query.mockResolvedValueOnce({ rows: [] })

      await updateWorkItem('wi-1', { tech_notes: 'Use Redis for caching' })

      const [sql, params] = mockDb.query.mock.calls[0]
      expect(sql).toContain('tech_notes')
      expect(params).toContain('Use Redis for caching')
    })

    it('includes wiki_page_id in UPDATE', async () => {
      mockDb.query.mockResolvedValueOnce({ rows: [] })

      await updateWorkItem('wi-1', { wiki_page_id: 'wiki-42' })

      const [sql, params] = mockDb.query.mock.calls[0]
      expect(sql).toContain('wiki_page_id')
      expect(params).toContain('wiki-42')
    })

    it('includes parent_id in UPDATE', async () => {
      mockDb.query.mockResolvedValueOnce({ rows: [] })

      await updateWorkItem('wi-1', { parent_id: 'parent-7' })

      const [sql, params] = mockDb.query.mock.calls[0]
      expect(sql).toContain('parent_id')
      expect(params).toContain('parent-7')
    })

    it('skips fields not in allowlist', async () => {
      mockDb.query.mockResolvedValueOnce({ rows: [] })

      // 'id' is not in the allowlist — should be ignored
      await updateWorkItem('wi-1', { id: 'hacked' } as never)

      // query should not be called (no valid fields → early return)
      expect(mockDb.query).not.toHaveBeenCalled()
    })
  })
})
