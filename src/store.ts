import { create } from 'zustand'
import { skeletons } from './data'
import type { InstalledModule, Page, Recommendation, RoomInput } from './types'

type Store = {
  page: Page
  direction: 1 | -1
  room: RoomInput
  recommendations: Recommendation[]
  skeletonId: string
  installed: InstalledModule[]
  history: InstalledModule[][]
  toast: string
  setPage: (page: Page, direction?: 1 | -1) => void
  setRoom: (room: Partial<RoomInput>) => void
  setRecommendations: (recommendations: Recommendation[]) => void
  setSkeleton: (id: string) => void
  install: (item: InstalledModule) => void
  remove: (id: string) => void
  undo: () => void
  replaceDesign: (skeletonId: string, modules: InstalledModule[]) => void
  showToast: (message: string) => void
}

const defaultRoom: RoomInput = {
  length: 320, width: 310, height: 320, houseType: 'apartment', wallType: 'concrete', wallMount: true, obstacle: 'none',
}

export const useAppStore = create<Store>((set, get) => ({
  page: 'intro', direction: 1, room: defaultRoom, recommendations: [], skeletonId: skeletons[0].id, installed: [], history: [], toast: '',
  setPage: (page, direction = 1) => set({ page, direction }),
  setRoom: (room) => set((state) => ({ room: { ...state.room, ...room } })),
  setRecommendations: (recommendations) => set({ recommendations }),
  setSkeleton: (skeletonId) => set({ skeletonId, installed: [], history: [] }),
  install: (item) => set((state) => ({ history: [...state.history, state.installed], installed: [...state.installed, item] })),
  remove: (id) => set((state) => ({ history: [...state.history, state.installed], installed: state.installed.filter((item) => item.id !== id) })),
  undo: () => {
    const history = get().history
    if (!history.length) return
    set({ installed: history.at(-1)!, history: history.slice(0, -1) })
  },
  replaceDesign: (skeletonId, installed) => set({ skeletonId, installed, history: [] }),
  showToast: (toast) => {
    set({ toast })
    window.setTimeout(() => set((state) => state.toast === toast ? { toast: '' } : state), 2200)
  },
}))
