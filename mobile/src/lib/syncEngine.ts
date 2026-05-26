import { pingServer, apiPost, apiUpload } from './api'
import {
  getPendingCheckins,
  markSyncing,
  markSynced,
  markFailed,
  updateServerPaths,
  PendingCheckin,
  PendingGuest,
} from './offlineQueue'
import * as FileSystem from 'expo-file-system'

let syncInterval: ReturnType<typeof setInterval> | null = null
let isSyncing = false

// Callbacks for UI notification
type SyncListener = (pendingCount: number) => void
const listeners = new Set<SyncListener>()

export function addSyncListener(fn: SyncListener) { listeners.add(fn) }
export function removeSyncListener(fn: SyncListener) { listeners.delete(fn) }

function notifyListeners(count: number) {
  listeners.forEach((fn) => fn(count))
}

// ---------- Start/Stop ----------

export function startSyncEngine(intervalMs = 30_000) {
  if (syncInterval) return
  console.log('[Sync] Engine started, polling every', intervalMs / 1000, 's')
  syncInterval = setInterval(() => runSync(), intervalMs)
  // Run immediately on start
  runSync()
}

export function stopSyncEngine() {
  if (syncInterval) {
    clearInterval(syncInterval)
    syncInterval = null
    console.log('[Sync] Engine stopped.')
  }
}

// ---------- Core Sync Loop ----------

async function runSync() {
  if (isSyncing) return
  isSyncing = true
  try {
    const isOnline = await pingServer()
    if (!isOnline) {
      console.log('[Sync] Server unreachable, skipping.')
      return
    }

    const pending = await getPendingCheckins()
    if (pending.length === 0) return

    console.log(`[Sync] Found ${pending.length} item(s) to sync.`)

    for (const item of pending) {
      await syncItem(item)
    }

    // Notify UI with updated count
    const remaining = await getPendingCheckins()
    notifyListeners(remaining.length)
  } catch (err) {
    console.error('[Sync] Error during sync run:', err)
  } finally {
    isSyncing = false
  }
}

async function syncItem(item: PendingCheckin) {
  try {
    await markSyncing(item.uuid)

    // 1. Upload guest portrait photos that haven't been uploaded yet
    const uploadedGuests: PendingGuest[] = []
    for (const guest of item.guests) {
      if (guest.localPhotoUri && !guest.serverPhotoPath) {
        try {
          const result = await apiUpload('/api/upload/portrait', guest.localPhotoUri, 'photo')
          uploadedGuests.push({ ...guest, serverPhotoPath: result.path, localPhotoUri: undefined })
        } catch {
          // Non-fatal — proceed without photo
          uploadedGuests.push({ ...guest, localPhotoUri: undefined })
        }
      } else {
        uploadedGuests.push(guest)
      }
    }

    // 2. Upload ID proof photo if not yet uploaded
    let serverIdProofPath = item.server_id_proof_path ?? null
    if (item.local_id_proof_uri && !serverIdProofPath) {
      try {
        const result = await apiUpload('/api/upload/id-proof', item.local_id_proof_uri, 'photo')
        serverIdProofPath = result.path
      } catch {
        // Non-fatal — proceed without ID proof
      }
    }

    // 3. Save updated paths
    await updateServerPaths(item.uuid, serverIdProofPath, JSON.stringify(uploadedGuests))

    // 4. Submit the booking
    const payload = {
      guests: uploadedGuests.map((g) => ({
        name: g.name,
        age: g.age ?? null,
        sex: g.sex ?? null,
        photo_path: g.serverPhotoPath ?? null,
        is_primary_contact: g.is_primary_contact,
      })),
      room_ids: item.room_ids,
      check_out_date: item.check_out_date,
      id_proof_path: serverIdProofPath,
      notes: item.notes ?? null,
    }

    await apiPost('/api/bookings', payload)
    await markSynced(item.uuid)

    // 5. Clean up local photo files to free phone storage
    await deleteLocalFiles(item, uploadedGuests)

    console.log(`[Sync] ✓ Synced check-in ${item.uuid}`)
  } catch (err) {
    console.error(`[Sync] ✗ Failed to sync ${item.uuid}:`, err)
    await markFailed(item.uuid)
  }
}

async function deleteLocalFiles(item: PendingCheckin, guests: PendingGuest[]) {
  // Delete ID proof
  if (item.local_id_proof_uri) {
    await FileSystem.deleteAsync(item.local_id_proof_uri, { idempotent: true })
  }
  // Delete portrait photos
  for (const g of guests) {
    if (g.localPhotoUri) {
      await FileSystem.deleteAsync(g.localPhotoUri, { idempotent: true })
    }
  }
}
