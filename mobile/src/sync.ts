import { ping, submitCheckin } from './api'
import { getQueue, removeFromQueue, bumpAttempts, enqueue } from './store'

/**
 * Try to submit a check-in. If offline, push to local queue.
 * Returns { ok, offline, queued }
 */
export async function smartCheckin(payload: any): Promise<{ ok: boolean; offline: boolean; reference?: string; queueId?: string }> {
  try {
    const res = await submitCheckin(payload)
    return { ok: true, offline: false, reference: res.booking_reference }
  } catch (err: any) {
    // Network failure or timeout → queue locally
    if (err.message === 'TIMEOUT' || err.message === 'NOT_PAIRED' || err.name === 'TypeError') {
      const queueId = await enqueue(payload)
      return { ok: false, offline: true, queueId }
    }
    throw err
  }
}

/**
 * Attempt to flush all queued check-ins to the server.
 * Returns number of successfully synced items.
 */
export async function syncQueue(): Promise<number> {
  const isOnline = await ping()
  if (!isOnline) return 0

  const queue = await getQueue()
  let synced = 0
  for (const item of queue) {
    try {
      await submitCheckin(item.payload)
      await removeFromQueue(item.id)
      synced++
    } catch {
      await bumpAttempts(item.id)
    }
  }
  return synced
}
