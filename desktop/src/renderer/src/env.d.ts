import type { SetupProgress } from '../preload/index'

declare global {
  interface Window {
    api: {
      setup: {
        isComplete: () => Promise<boolean>
        run: () => Promise<{ success: boolean; error?: string }>
        onProgress: (cb: (p: SetupProgress) => void) => () => void
      }
      boot: () => Promise<{ needsSetup: boolean; port?: number; error?: string }>
      rooms: {
        list: () => Promise<any[]>
        available: () => Promise<any[]>
        add: (data: any) => Promise<any>
        updateStatus: (id: number, status: string) => Promise<any>
        delete: (id: number) => Promise<any>
      }
      bookings: {
        list: () => Promise<any[]>
        checkout: (id: number) => Promise<any>
      }
      checkin: {
        submit: (data: {
          bookingId: number
          guestName: string
          photo_path: string
          document_path: string
        }) => Promise<any>
      }
      dialog: { pickImage: () => Promise<string | null> }
      photo: { save: (d: { dataUrl: string; prefix?: string }) => Promise<string> }
      stats: {
        get: () => Promise<any>
      }
      server: {
        info: () => Promise<any>
        regenerateToken: () => Promise<any>
      }
    }
  }
}

export {}
