import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getSubtasks, addAttachment, deleteAttachment, updateWorkItem } from '../../../db/queries/workItems'

vi.mock('@/db/client', () => ({
  getDb: vi.fn(),
}))

import { getDb } from '@/db/client'

describe('workItem queries', () => {
  let mockDb: { query: ReturnType<typeof vi.fn>; exec: ReturnType<typeof vi.fn> }

  beforeEach(() => {
    mockDb = { query: vi.fn(), exec: vi.fn() }
    ;(getDb as ReturnType<typeof vi.fn>).mockReturnValue(mockDb)
  })

  describe('getSubtasks', () => {
    it('queries work_items by parent_id and returns rows', async () => {
      const fakeRows = [
        { id: 'sub-1', title: 'Sub task 1', parent_id: 'parent-1' },
        { id: 'sub-2', title: 'Sub task 2', parent_id: 'parent-1' },
      ]
      mockDb.query.mockResolvedValueOnce({ rows: fakeRows })

      const result = await getSubtasks('parent-1')

      expect(mockDb.query).toHaveBeenCalledOnce()
      const [sql, params] = mockDb.query.mock.calls[0]
      expect(sql).toContain('parent_id = $1')
      expect(params).toEqual(['parent-1'])
      expect(result).toEqual(fakeRows)
    })
  })

  describe('addAttachment', () => {
    it('inserts attachment with correct params and returns the inserted row', async () => {
      const fakeRow = {
        id: 'att-uuid',
        work_item_id: 'item-1',
        filename: 'test.png',
        mime_type: 'image/png',
        size_bytes: 768,
        created_at: '2025-01-01T00:00:00Z',
      }
      mockDb.query.mockResolvedValueOnce({ rows: [fakeRow] })

      // base64 string of length ~1024 => sizeBytes = round(1024 * 0.75) = 768
      const base64Data = 'A'.repeat(1024)
      const result = await addAttachment('item-1', 'test.png', 'image/png', base64Data)

      expect(mockDb.query).toHaveBeenCalledOnce()
      const [sql, params] = mockDb.query.mock.calls[0]
      expect(sql).toContain('INSERT INTO work_item_attachments')
      expect(params[1]).toBe('item-1')
      expect(params[2]).toBe('test.png')
      expect(params[3]).toBe('image/png')
      expect(params[4]).toBe(768) // size_bytes = round(1024 * 0.75)
      expect(params[5]).toBe(base64Data)
      expect(result).toEqual(fakeRow)
    })
  })

  describe('deleteAttachment', () => {
    it('executes DELETE with correct id', async () => {
      mockDb.query.mockResolvedValueOnce({ rows: [] })

      await deleteAttachment('att-123')

      expect(mockDb.query).toHaveBeenCalledOnce()
      const [sql, params] = mockDb.query.mock.calls[0]
      expect(sql).toContain('DELETE FROM work_item_attachments')
      expect(params).toEqual(['att-123'])
    })
  })

  describe('updateWorkItem', () => {
    it('includes acceptance_criteria in the UPDATE statement', async () => {
      mockDb.query.mockResolvedValueOnce({ rows: [] })

      await updateWorkItem('item-1', { acceptance_criteria: 'Must pass all tests' })

      expect(mockDb.query).toHaveBeenCalledOnce()
      const [sql, params] = mockDb.query.mock.calls[0]
      expect(sql).toContain('acceptance_criteria')
      expect(params).toContain('Must pass all tests')
    })

    it('includes tech_notes in the UPDATE statement', async () => {
      mockDb.query.mockResolvedValueOnce({ rows: [] })

      await updateWorkItem('item-2', { tech_notes: 'Use Redis for caching' })

      expect(mockDb.query).toHaveBeenCalledOnce()
      const [sql, params] = mockDb.query.mock.calls[0]
      expect(sql).toContain('tech_notes')
      expect(params).toContain('Use Redis for caching')
    })
  })
})
