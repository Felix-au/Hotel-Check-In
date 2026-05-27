import { app } from 'electron'
import * as fs from 'fs'
import * as path from 'path'
import { randomBytes } from 'crypto'

let apiToken: string | null = null

export function getApiToken(): string {
  if (apiToken) return apiToken

  const userDataDir = app.getPath('userData')
  const configPath = path.join(userDataDir, 'config.json')

  if (fs.existsSync(configPath)) {
    try {
      const data = JSON.parse(fs.readFileSync(configPath, 'utf8'))
      if (data.apiToken) {
        apiToken = data.apiToken
        return apiToken!
      }
    } catch (err) {
      console.error('[Auth] Failed to parse config.json, generating new token:', err)
    }
  }

  // Generate a cryptographically secure random 24-byte hex token
  apiToken = randomBytes(24).toString('hex')
  try {
    fs.writeFileSync(configPath, JSON.stringify({ apiToken }, null, 2), 'utf8')
    console.log('[Auth] Generated new API pairing token.')
  } catch (err) {
    console.error('[Auth] Failed to write config.json:', err)
  }

  return apiToken!
}
