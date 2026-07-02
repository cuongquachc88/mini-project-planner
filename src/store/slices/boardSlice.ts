import type { Priority, WorkItemType } from '@/types/db'

export interface BoardFilter {
  assigneeId?: string
  priority?: Priority
  type?: WorkItemType
  labelId?: string
  epicId?: string
}

export interface BoardSlice {
  activeDragId: string | null
  boardFilters: BoardFilter
  setActiveDragId: (id: string | null) => void
  setBoardFilters: (filters: BoardFilter) => void
  clearBoardFilters: () => void
}

export const createBoardSlice = (set: (fn: (s: BoardSlice) => Partial<BoardSlice>) => void): BoardSlice => ({
  activeDragId: null,
  boardFilters: {},
  setActiveDragId: (id) => set(() => ({ activeDragId: id })),
  setBoardFilters: (filters) => set((s) => ({ boardFilters: { ...s.boardFilters, ...filters } })),
  clearBoardFilters: () => set(() => ({ boardFilters: {} })),
})
