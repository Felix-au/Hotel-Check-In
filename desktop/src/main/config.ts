import { app } from 'electron'
import * as fs from 'fs'
import * as path from 'path'
import * as crypto from 'crypto'

export interface AppConfig {
  apiToken: string
  setupComplete: boolean
}

let _config: AppConfig | null = null

function getConfigPath(): string {
  return path.join(app.getPath('userData'), 'config.json')
}

export function loadConfig(): AppConfig {
  if (_config) return _config

  const configPath = getConfigPath()
  if (fs.existsSync(configPath)) {
    try {
      _config = JSON.parse(fs.readFileSync(configPath, 'utf8'))
      return _config!
    } catch {
      /* fall through to create new */
    }
  }

  // First run — generate a new config
  _config = {
    apiToken: crypto.randomBytes(24).toString('hex'),
    setupComplete: false
  }
  saveConfig()
  return _config
}

export function saveConfig(): void {
  fs.writeFileSync(getConfigPath(), JSON.stringify(_config, null, 2), 'utf8')
}

export function getApiToken(): string {
  return loadConfig().apiToken
}

export function isSetupComplete(): boolean {
  return loadConfig().setupComplete
}

export function markSetupComplete(): void {
  const cfg = loadConfig()
  cfg.setupComplete = true
  saveConfig()
}

export function regenerateToken(): string {
  const cfg = loadConfig()
  cfg.apiToken = crypto.randomBytes(24).toString('hex')
  saveConfig()
  _config = cfg
  return cfg.apiToken
}
