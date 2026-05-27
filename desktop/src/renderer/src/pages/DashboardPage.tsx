import { useEffect, useState } from 'react'

interface Stats {
  rooms: { total: number; available: number; occupied: number; maintenance: number; checkout: number }
  today_checkins: number
  active_bookings: number
  recent: any[]
}

export default function DashboardPage({ onNavigate }: { onNavigate: (page: string) => void }): JSX.Element {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  const load = async (): Promise<void> => {
    setLoading(true)
    try {
      const s = await window.api.stats.get()
      setStats(s)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const statusColor: Record<string, string> = {
    checked_in: 'badge-green',
    checked_out: 'badge-navy',
    cancelled: 'badge-red',
  }

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-sub">Live overview of your hotel</p>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={load}>↻ Refresh</button>
      </div>

      {loading && <div style={{ textAlign: 'center', padding: 40 }}><div className="spinner" /></div>}

      {!loading && stats && (
        <>
          {/* Stats */}
          <div className="stats-grid">
            {[
              { label: 'Total Rooms',     value: stats.rooms?.total ?? 0,      icon: '🏠', sub: 'registered' },
              { label: 'Available',       value: stats.rooms?.available ?? 0,   icon: '✓',  sub: 'ready to book', accent: 'var(--green)' },
              { label: 'Occupied',        value: stats.rooms?.occupied ?? 0,    icon: '🔑', sub: 'checked in' },
              { label: 'Maintenance',     value: stats.rooms?.maintenance ?? 0, icon: '🔧', sub: 'out of service', accent: 'var(--amber)' },
              { label: 'Check-ins Today', value: stats.today_checkins ?? 0,     icon: '📅', sub: 'new today', accent: 'var(--accent)' },
              { label: 'Active Bookings', value: stats.active_bookings ?? 0,    icon: '📋', sub: 'currently in' },
            ].map((s) => (
              <div key={s.label} className="stat-card">
                <span className="stat-icon">{s.icon}</span>
                <span className="stat-label">{s.label}</span>
                <span className="stat-value" style={s.accent ? { color: s.accent } : {}}>{s.value}</span>
                <span className="stat-sub">{s.sub}</span>
              </div>
            ))}
          </div>

          {/* Quick actions */}
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <button className="btn btn-primary" onClick={() => onNavigate('checkin')}>✚ New Check-In</button>
            <button className="btn btn-ghost" onClick={() => onNavigate('rooms')}>🏠 Manage Rooms</button>
            <button className="btn btn-ghost" onClick={() => onNavigate('bookings')}>📋 View Bookings</button>
          </div>

          {/* Recent bookings */}
          <div className="card">
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', fontWeight: 700, fontSize: 14 }}>
              Recent Activity
            </div>
            <div className="table-wrap">
              {!stats.recent?.length ? (
                <div className="empty-state">
                  <div className="empty-icon">📋</div>
                  No check-ins yet. <button className="btn btn-primary btn-sm" style={{ marginLeft: 10 }} onClick={() => onNavigate('checkin')}>Check someone in</button>
                </div>
              ) : (
                <table>
                  <thead>
                    <tr>
                      <th>Reference</th><th>Guest</th><th>Rooms</th><th>Check-In</th><th>Check-Out</th><th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.recent.map((b: any) => (
                      <tr key={b.id}>
                        <td><code style={{ color: 'var(--accent)', fontSize: 12 }}>{b.booking_reference}</code></td>
                        <td style={{ fontWeight: 600 }}>{b.guests ?? '—'}</td>
                        <td>{b.rooms ?? '—'}</td>
                        <td style={{ color: 'var(--text-sec)', fontSize: 12 }}>{b.check_in_time?.slice(0, 16).replace('T', ' ')}</td>
                        <td style={{ color: 'var(--text-sec)', fontSize: 12 }}>{b.check_out_date}</td>
                        <td><span className={`badge ${statusColor[b.status] ?? 'badge-navy'}`}>{b.status.replace('_', ' ')}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </>
      )}
    </>
  )
}
