import { contextBridge, ipcRenderer } from 'electron'

export type SetupProgress = {
  step: string
  status: 'running' | 'done' | 'error'
  detail?: string
}

const api = {
  // Setup
  setup: {
    isComplete: (): Promise<boolean> => ipcRenderer.invoke('setup:isComplete'),
    run: (): Promise<{ success: boolean; error?: string }> => ipcRenderer.invoke('setup:run'),
    onProgress: (cb: (p: SetupProgress) => void) => {
      ipcRenderer.on('setup:progress', (_e, p) => cb(p))
      return () => ipcRenderer.removeAllListeners('setup:progress')
    }
  },

  // App boot (silent start on subsequent launches)
  boot: (): Promise<{ needsSetup: boolean; port?: number; error?: string }> =>
    ipcRenderer.invoke('app:boot'),

  // Rooms
  rooms: {
    list: () => ipcRenderer.invoke('rooms:list'),
    available: () => ipcRenderer.invoke('rooms:available'),
    add: (data: { room_number: string; room_type: string; floor: number; price_per_night: number; notes?: string }) =>
      ipcRenderer.invoke('rooms:add', data),
    updateStatus: (id: number, status: string) => ipcRenderer.invoke('rooms:updateStatus', { id, status }),
    delete: (id: number) => ipcRenderer.invoke('rooms:delete', { id })
  },

  // Bookings
  bookings: {
    list: () => ipcRenderer.invoke('bookings:list'),
    checkout: (id: number) => ipcRenderer.invoke('bookings:checkout', { id })
  },

  // Check-in from desktop
  checkin: {
    submit: (data: {
      guests: { name: string; age?: number; sex?: string; is_primary?: boolean }[]
      room_ids: number[]
      check_out_date: string
      notes?: string
    }) => ipcRenderer.invoke('checkin:submit', data)
  },

  // Stats
  stats: {
    get: () => ipcRenderer.invoke('stats:get')
  },

  // Server / Pairing
  server: {
    info: () => ipcRenderer.invoke('server:info'),
    regenerateToken: () => ipcRenderer.invoke('server:regenerateToken')
  }
}

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore
  window.api = api
}
