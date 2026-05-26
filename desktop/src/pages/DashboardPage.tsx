import { useEffect, useState } from 'react'

const API = 'http://localhost:8080'

interface Stats {
  rooms: { total: number; available: number; occupied: number; maintenance: number; checkout: number }
  active_bookings: number
  guests_today: number
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchStats = async () => {
    try {
      const res = await fetch(`${API}/api/settings/stats`)
      const data = await res.json()
      setStats(data)
      setError('')
    } catch {
      setError('Cannot connect to local server. Ensure the API server is running.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStats()
    const interval = setInterval(fetchStats, 15000)
    return () => clearInterval(interval)
  }, [])

  const SKELETON_LABELS = ['Available Rooms','Occupied Rooms','Active Bookings',"Today's Guests",'Maintenance','Total Rooms']

  const statCards = stats
    ? [
        { label: 'Available Rooms',   value: stats.rooms.available,   color: 'var(--green)',  bg: 'var(--green-dim)',  icon: '✓', skeleton: false },
        { label: 'Occupied Rooms',    value: stats.rooms.occupied,    color: 'var(--red)',    bg: 'var(--red-dim)',    icon: '●', skeleton: false },
        { label: 'Active Bookings',   value: stats.active_bookings,   color: 'var(--accent)', bg: 'var(--accent-dim)', icon: '≡', skeleton: false },
        { label: "Today's Guests",    value: stats.guests_today,      color: 'var(--blue)',   bg: 'var(--blue-dim)',   icon: '♟', skeleton: false },
        { label: 'Maintenance',       value: stats.rooms.maintenance, color: 'var(--amber)',  bg: 'var(--amber-dim)',  icon: '⚙', skeleton: false },
        { label: 'Total Rooms',       value: stats.rooms.total,       color: 'var(--text-secondary)', bg: 'var(--bg-glass)', icon: '⊞', skeleton: false },
      ]
    : SKELETON_LABELS.map(label => ({ label, value: '—' as string | number, color: 'var(--text-muted)', bg: 'var(--bg-glass)', icon: '·', skeleton: true }))

  return (
    <div className="dashboard animate-fade">
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-sub">Live property overview · Updates every 15 seconds</p>
        </div>
        <button className="btn btn-ghost" onClick={fetchStats}>↻ Refresh</button>
      </div>

      {error && (
        <div className="alert-error">{error}</div>
      )}

      {loading && !stats && (
        <div className="loading-state">
          <span className="animate-spin">⟳</span>
          <span>Connecting to local server...</span>
        </div>
      )}

      <div className="stat-grid">
        {statCards.map(({ label, value, color, bg, icon, skeleton }) => (
          <div key={label} className={`stat-card glass-card${skeleton ? ' stat-skeleton' : ''}`}>
            <div className="stat-icon" style={{ background: bg, color }}>
              {icon}
            </div>
            <div className="stat-body">
              <div className="stat-value" style={{ color }}>{value ?? '—'}</div>
              <div className="stat-label">{label}</div>
            </div>
          </div>
        ))}
      </div>

      <style>{`
        .dashboard { display: flex; flex-direction: column; gap: 28px; }
        .page-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 12px;
        }
        .page-title { font-size: 24px; font-weight: 800; color: var(--text-primary); }
        .page-sub   { font-size: 13px; color: var(--text-muted); margin-top: 4px; }
        .alert-error {
          padding: 14px 18px;
          background: var(--red-dim);
          border: 1px solid rgba(255,94,125,0.25);
          border-radius: var(--r-md);
          color: var(--red);
          font-size: 13px;
        }
        .loading-state {
          display: flex;
          align-items: center;
          gap: 12px;
          color: var(--text-muted);
          font-size: 14px;
          padding: 40px 0;
          justify-content: center;
        }
        .stat-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          gap: 16px;
        }
        .stat-skeleton { opacity: 0.45; }
        .stat-skeleton .stat-value { font-size: 20px; }
        .stat-card {
          padding: 20px;
          display: flex;
          align-items: center;
          gap: 16px;
          transition: transform var(--t-fast), box-shadow var(--t-fast);
        }
        .stat-card:hover {
          transform: translateY(-2px);
          box-shadow: var(--shadow-md);
        }
        .stat-icon {
          width: 48px;
          height: 48px;
          border-radius: var(--r-md);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 20px;
          flex-shrink: 0;
        }
        .stat-value {
          font-size: 28px;
          font-weight: 800;
          line-height: 1;
        }
        .stat-label {
          font-size: 12px;
          color: var(--text-muted);
          margin-top: 4px;
          font-weight: 500;
        }
      `}</style>
    </div>
  )
}
