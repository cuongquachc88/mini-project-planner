export interface UiSlice {
  sidebarOpen: boolean
  theme: 'dark' | 'light'
  activeModal: string | null
  locked: boolean
  setSidebarOpen: (open: boolean) => void
  toggleSidebar: () => void
  setTheme: (theme: 'dark' | 'light') => void
  openModal: (id: string) => void
  closeModal: () => void
  lock: () => void
  unlock: () => void
}

export const createUiSlice = (set: (fn: (s: UiSlice) => Partial<UiSlice>) => void): UiSlice => ({
  sidebarOpen: true,
  theme: 'dark',
  activeModal: null,
  locked: true,
  setSidebarOpen: (open) => set(() => ({ sidebarOpen: open })),
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setTheme: (theme) => set(() => ({ theme })),
  openModal: (id) => set(() => ({ activeModal: id })),
  closeModal: () => set(() => ({ activeModal: null })),
  lock: () => set(() => ({ locked: true })),
  unlock: () => set(() => ({ locked: false })),
})
