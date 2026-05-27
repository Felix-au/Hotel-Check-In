import { getServerConfig } from './store'

class ApiError extends Error {
  constructor(public status: number, message: string) { super(message) }
}

async function request(path: string, options: RequestInit = {}, timeoutMs = 8000) {
  const cfg = await getServerConfig()
  if (!cfg) throw new Error('NOT_PAIRED')

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const res = await fetch(`${cfg.url}${path}`, {
      ...options,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${cfg.token}`,
        ...(options.headers ?? {})
      }
    })
    clearTimeout(timer)
    if (!res.ok) throw new ApiError(res.status, `HTTP ${res.status}`)
    return res.json()
  } catch (err: any) {
    clearTimeout(timer)
    if (err.name === 'AbortError') throw new Error('TIMEOUT')
    throw err
  }
}

// ── Health check ───────────────────────────────────────────────────────────────
export async function ping(): Promise<boolean> {
  try { await request('/api/health', {}, 4000); return true }
  catch { return false }
}

// ── Rooms ──────────────────────────────────────────────────────────────────────
export async function fetchAvailableRooms() {
  const data = await request('/api/rooms/available')
  return data.rooms ?? data  // unwrap { rooms: [...] } or return array directly
}

// ── Check-in ──────────────────────────────────────────────────────────────────
export async function submitCheckin(payload: {
  guests: { name: string; phone?: string; age?: number; sex?: string; is_primary?: boolean }[]
  room_ids: number[]
  check_out_date: string
  notes?: string
}) {
  return request('/api/checkin', { method: 'POST', body: JSON.stringify(payload) })
}
