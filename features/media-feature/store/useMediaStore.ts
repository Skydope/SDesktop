import { create } from 'zustand'

export type MediaType = 'image' | 'youtube'

export interface MediaWindow {
  id: string
  type: MediaType
  url: string
  title: string
  x: number
  y: number
  width: number
  height: number
  zIndex: number
  minimized: boolean
}

interface MediaStore {
  windows: MediaWindow[]
  zCounter: number
  addWindow: (type: MediaType, url: string) => void
  removeWindow: (id: string) => void
  bringToFront: (id: string) => void
  updatePosition: (id: string, x: number, y: number) => void
  updateSize: (id: string, width: number, height: number) => void
  toggleMinimize: (id: string) => void
}

function getYouTubeId(url: string): string | null {
  const match = url.match(
    /(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|v\/))([A-Za-z0-9_-]{11})/
  )
  return match ? match[1] : null
}

function deriveTitle(type: MediaType, url: string): string {
  if (type === 'youtube') {
    return 'YouTube Video'
  }
  const name = url.split('/').pop()?.split('?')[0] ?? 'imagen'
  return name.length > 28 ? name.slice(0, 28) + '…' : name
}

export const useMediaStore = create<MediaStore>((set, get) => ({
  windows: [],
  zCounter: 10,

  addWindow: (type, url) => {
    const { zCounter, windows } = get()
    const newZ = zCounter + 1
    const offset = windows.length * 28

    const id = `media-${Date.now()}`
    const isYt = type === 'youtube'

    const window: MediaWindow = {
      id,
      type,
      url: isYt ? (getYouTubeId(url) ?? url) : url,
      title: deriveTitle(type, url),
      x: 80 + offset,
      y: 60 + offset,
      width: isYt ? 480 : 360,
      height: isYt ? 300 : 280,
      zIndex: newZ,
      minimized: false,
    }

    set({ windows: [...windows, window], zCounter: newZ })
  },

  removeWindow: (id) =>
    set((s) => ({ windows: s.windows.filter((w) => w.id !== id) })),

  bringToFront: (id) =>
    set((s) => {
      const newZ = s.zCounter + 1
      return {
        zCounter: newZ,
        windows: s.windows.map((w) =>
          w.id === id ? { ...w, zIndex: newZ } : w
        ),
      }
    }),

  updatePosition: (id, x, y) =>
    set((s) => ({
      windows: s.windows.map((w) => (w.id === id ? { ...w, x, y } : w)),
    })),

  updateSize: (id, width, height) =>
    set((s) => ({
      windows: s.windows.map((w) =>
        w.id === id ? { ...w, width, height } : w
      ),
    })),

  toggleMinimize: (id) =>
    set((s) => ({
      windows: s.windows.map((w) =>
        w.id === id ? { ...w, minimized: !w.minimized } : w
      ),
    })),
}))

export { getYouTubeId }
