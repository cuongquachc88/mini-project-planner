import { create } from 'zustand'
import { createAppSlice, type AppSlice } from './slices/appSlice'
import { createBoardSlice, type BoardSlice } from './slices/boardSlice'
import { createSprintSlice, type SprintSlice } from './slices/sprintSlice'
import { createUiSlice, type UiSlice } from './slices/uiSlice'
import { createSyncSlice, type SyncSlice } from './slices/syncSlice'

type BoundStore = AppSlice & BoardSlice & SprintSlice & UiSlice & SyncSlice

export const useStore = create<BoundStore>((set) => ({
  ...createAppSlice(set as Parameters<typeof createAppSlice>[0]),
  ...createBoardSlice(set as Parameters<typeof createBoardSlice>[0]),
  ...createSprintSlice(set as Parameters<typeof createSprintSlice>[0]),
  ...createUiSlice(set as Parameters<typeof createUiSlice>[0]),
  ...createSyncSlice(set as Parameters<typeof createSyncSlice>[0]),
}))
