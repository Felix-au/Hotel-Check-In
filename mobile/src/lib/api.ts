import AsyncStorage from '@react-native-async-storage/async-storage'

const STORAGE_KEY = 'server_config'

export interface ServerConfig {
  url: string   // e.g. "http://192.168.1.15:8080"
  token?: string
}

export async function getServerConfig(): Promise<ServerConfig | null> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export async function saveServerConfig(config: ServerConfig): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(config))
}

export async function clearServerConfig(): Promise<void> {
  await AsyncStorage.removeItem(STORAGE_KEY)
}

// ---------- HTTP helpers ----------

async function getBaseUrl(): Promise<string> {
  const config = await getServerConfig()
  if (!config) throw new Error('No server configured. Scan the QR code first.')
  return config.url.replace(/\/$/, '')
}

export async function apiGet<T>(path: string): Promise<T> {
  const base = await getBaseUrl()
  const res = await fetch(`${base}${path}`, {
    headers: { 'Content-Type': 'application/json' },
  })
  if (!res.ok) throw new Error(`GET ${path} failed: ${res.status}`)
  return res.json()
}

export async function apiPost<T>(path: string, body: unknown): Promise<T> {
  const base = await getBaseUrl()
  const res = await fetch(`${base}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Unknown error' }))
    throw new Error(err.error ?? `POST ${path} failed: ${res.status}`)
  }
  return res.json()
}

export async function apiUpload(path: string, fileUri: string, fieldName: string): Promise<{ path: string; filename: string }> {
  const base = await getBaseUrl()
  const formData = new FormData()
  formData.append(fieldName, {
    uri: fileUri,
    type: 'image/jpeg',
    name: `${fieldName}-${Date.now()}.jpg`,
  } as any)

  const res = await fetch(`${base}${path}`, {
    method: 'POST',
    body: formData,
  })
  if (!res.ok) throw new Error(`Upload ${path} failed: ${res.status}`)
  return res.json()
}

export async function pingServer(): Promise<boolean> {
  try {
    const base = await getBaseUrl()
    const res = await fetch(`${base}/api/health`, { signal: AbortSignal.timeout(4000) })
    return res.ok
  } catch {
    return false
  }
}
