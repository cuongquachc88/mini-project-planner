export interface SprintSlice {
  activeSprintId: string | null
  viewMode: 'board' | 'backlog'
  setActiveSprintId: (id: string | null) => void
  setViewMode: (mode: 'board' | 'backlog') => void
}

export const createSprintSlice = (set: (fn: (s: SprintSlice) => Partial<SprintSlice>) => void): SprintSlice => ({
  activeSprintId: null,
  viewMode: 'board',
  setActiveSprintId: (id) => set(() => ({ activeSprintId: id })),
  setViewMode: (mode) => set(() => ({ viewMode: mode })),
})
