import express, { Application, Request, Response, NextFunction } from 'express'
import cors from 'cors'
import * as http from 'http'
import * as os from 'os'
import { getApiToken } from './config'
import { dbAll, dbGet, dbRun } from './db'
import QRCode from 'qrcode'

let server: http.Server | null = null
export let apiPort = 8080

export function getLocalIp(): string {
  const interfaces = os.networkInterfaces()
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name] ?? []) {
      if (iface.family === 'IPv4' && !iface.internal) return iface.address
    }
  }
  return '127.0.0.1'
}

export async function startApiServer(): Promise<number> {
  const app: Application = express()

  app.use(cors({ origin: '*' }))
  app.use(express.json({ limit: '20mb' }))

  // PUBLIC: health check (no auth — used for initial connectivity test)
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', version: '1.0.0', ts: new Date().toISOString() })
  })

  // AUTH middleware for all other routes
  app.use((req: Request, res: Response, next: NextFunction) => {
    if (req.method === 'OPTIONS') return next()
    const ip = req.ip ?? ''
    const isLocal = ip === '127.0.0.1' || ip === '::1' || ip === '::ffff:127.0.0.1'
    if (isLocal) return next()

    const auth = req.headers.authorization
    if (auth === `Bearer ${getApiToken()}`) {
      console.log(`[API] ${req.method} ${req.path} from ${ip}`)
      return next()
    }
    console.warn(`[API] BLOCKED ${req.method} ${req.path} from ${ip}`)
    res.status(401).json({ error: 'Unauthorized' })
  })

  // ─── Rooms ───────────────────────────────────────────────────────────────
  app.get('/api/rooms', (_req, res) => {
    try {
      const rooms = dbAll(`
        SELECT r.*,
          bg.booking_reference,
          bg.check_out_date,
          GROUP_CONCAT(g.name, ', ') AS guest_names
        FROM rooms r
        LEFT JOIN room_allocations ra ON ra.room_id = r.id
        LEFT JOIN booking_groups bg ON bg.id = ra.group_id AND bg.status = 'checked_in'
        LEFT JOIN guests g ON g.group_id = bg.id
        GROUP BY r.id
        ORDER BY r.floor, r.room_number
      `)
      res.json({ rooms })
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch rooms' })
    }
  })

  app.get('/api/rooms/available', (_req, res) => {
    try {
      const rooms = dbAll(`SELECT * FROM rooms WHERE status = 'available' ORDER BY floor, room_number`)
      res.json({ rooms })
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch rooms' })
    }
  })

  // ─── Check-in (from mobile) ───────────────────────────────────────────────
  app.post('/api/checkin', (req, res) => {
    const { guests, room_ids, check_out_date, notes } = req.body
    if (!guests?.length || !room_ids?.length || !check_out_date) {
      return res.status(400).json({ error: 'guests, room_ids, and check_out_date are required' })
    }

    try {
      const ref = 'SS' + Date.now().toString(36).toUpperCase()
      const groupId = dbRun(
        `INSERT INTO booking_groups (booking_reference, check_out_date, notes) VALUES (?, ?, ?)`,
        [ref, check_out_date, notes ?? null]
      )

      for (const g of guests) {
        dbRun(
          `INSERT INTO guests (group_id, name, phone, age, sex, is_primary_contact) VALUES (?, ?, ?, ?, ?, ?)`,
          [groupId, g.name, g.phone ?? null, g.age ?? null, g.sex ?? null, g.is_primary ? 1 : 0]
        )
      }

      for (const roomId of room_ids) {
        dbRun(`INSERT INTO room_allocations (group_id, room_id) VALUES (?, ?)`, [groupId, roomId])
        dbRun(`UPDATE rooms SET status = 'occupied', updated_at = datetime('now') WHERE id = ?`, [roomId])
      }

      res.status(201).json({ booking_reference: ref, group_id: groupId })
    } catch (err: any) {
      console.error('[API] Check-in error:', err)
      res.status(500).json({ error: err.message ?? 'Check-in failed' })
    }
  })

  // ─── Bookings ─────────────────────────────────────────────────────────────
  app.get('/api/bookings', (_req, res) => {
    try {
      const bookings = dbAll(`
        SELECT bg.*,
          GROUP_CONCAT(r.room_number, ', ') AS rooms,
          GROUP_CONCAT(DISTINCT g.name, ', ') AS guests
        FROM booking_groups bg
        LEFT JOIN room_allocations ra ON ra.group_id = bg.id
        LEFT JOIN rooms r ON r.id = ra.room_id
        LEFT JOIN guests g ON g.group_id = bg.id
        GROUP BY bg.id
        ORDER BY bg.check_in_time DESC
      `)
      res.json({ bookings })
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch bookings' })
    }
  })

  // ─── Server info (for QR generation — local only) ─────────────────────────
  app.get('/api/server-info', async (_req, res) => {
    try {
      const ip = getLocalIp()
      const url = `http://${ip}:${apiPort}`
      const token = getApiToken()
      const qr = await QRCode.toDataURL(JSON.stringify({ url, token }), {
        width: 256,
        margin: 2,
        color: { dark: '#F5F5F0', light: '#0D1B2E' }
      })
      res.json({ ip, port: apiPort, url, token, qr })
    } catch (err) {
      res.status(500).json({ error: 'Failed to generate server info' })
    }
  })

  // ─── Stats (dashboard) ────────────────────────────────────────────────────
  app.get('/api/stats', (_req, res) => {
    try {
      const roomStats = dbGet(`
        SELECT
          COUNT(*) as total,
          SUM(CASE WHEN status='available' THEN 1 ELSE 0 END) as available,
          SUM(CASE WHEN status='occupied' THEN 1 ELSE 0 END) as occupied,
          SUM(CASE WHEN status='maintenance' THEN 1 ELSE 0 END) as maintenance
        FROM rooms
      `)
      const todayCheckins = dbGet(`
        SELECT COUNT(*) as count FROM booking_groups
        WHERE date(check_in_time) = date('now') AND status = 'checked_in'
      `)
      const activeBookings = dbGet(`
        SELECT COUNT(*) as count FROM booking_groups WHERE status = 'checked_in'
      `)
      res.json({ rooms: roomStats, today_checkins: todayCheckins?.count ?? 0, active_bookings: activeBookings?.count ?? 0 })
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch stats' })
    }
  })

  apiPort = await findAvailablePort(8080)

  return new Promise((resolve, reject) => {
    server = app.listen(apiPort, '0.0.0.0', () => {
      console.log(`[API] Server listening on 0.0.0.0:${apiPort}`)
      resolve(apiPort)
    })
    server.on('error', reject)
  })
}

export function stopApiServer(): Promise<void> {
  return new Promise((resolve) => {
    if (server) server.close(() => resolve())
    else resolve()
  })
}

async function findAvailablePort(start: number): Promise<number> {
  const net = await import('net')
  return new Promise((resolve) => {
    const s = net.createServer()
    s.listen(start, '0.0.0.0', () => {
      s.close(() => resolve(start))
    })
    s.on('error', () => resolve(findAvailablePort(start + 1) as unknown as number))
  })
}
