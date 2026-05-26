import { useEffect, useState } from 'react'

const API = 'http://localhost:8080'

interface Booking {
  id: number
  booking_reference: string
  check_in_time: string
  check_out_date: string
  status: 'checked_in' | 'checked_out' | 'cancelled'
  guest_names: string
  guest_count: number
  rooms: string
}

export default function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading]   = useState(true)
  const [filter, setFilter]     = useState('checked_in')

  const fetchBookings = async () => {
    try {
      const params = filter !== 'all' ? `?status=${filter}` : ''
      const res  = await fetch(`${API}/api/bookings${params}`)
      const data = await res.json()
      setBookings(data.bookings ?? [])
    } catch { /* silent */ }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchBookings() }, [filter])

  const checkout = async (id: number) => {
    if (!confirm('Confirm guest checkout?')) return
    await fetch(`${API}/api/bookings/${id}/checkout`, { method: 'POST' })
    fetchBookings()
  }

  const fmtDate = (d: string) => new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
  const fmtTime = (d: string) => new Date(d).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })

  return (
    <div className="bookings-page animate-fade">
      <div className="page-header">
        <div>
          <h1 className="page-title">Bookings</h1>
          <p className="page-sub">{bookings.length} records · {filter === 'checked_in' ? 'Active' : filter === 'checked_out' ? 'Checked Out' : 'All'}</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          {['checked_in','checked_out','all'].map(s => (
            <button key={s} className={`filter-btn ${filter === s ? 'active' : ''}`} onClick={() => setFilter(s)}>
              {s === 'checked_in' ? 'Active' : s === 'checked_out' ? 'Checked Out' : 'All'}
            </button>
          ))}
        </div>
      </div>

      {loading
        ? <div className="loading-state"><span className="animate-spin">⟳</span> Loading...</div>
        : (
          <div className="booking-list">
            {bookings.map(b => (
              <div key={b.id} className="booking-row glass-card">
                <div className="booking-ref">
                  <span className="ref-code">{b.booking_reference}</span>
                  <span className={`badge ${b.status === 'checked_in' ? 'badge-green' : b.status === 'checked_out' ? 'badge-accent' : 'badge-red'}`}>
                    {b.status === 'checked_in' ? 'Active' : b.status === 'checked_out' ? 'Checked Out' : 'Cancelled'}
                  </span>
                </div>
                <div className="booking-meta">
                  <span>👥 {b.guest_count} guest{b.guest_count !== 1 ? 's' : ''}</span>
                  <span>🏨 Rooms: {b.rooms || '—'}</span>
                  <span>📅 In: {fmtTime(b.check_in_time)}</span>
                  <span>📅 Out: {fmtDate(b.check_out_date)}</span>
                </div>
                <div className="booking-guests">{b.guest_names}</div>
                <div className="booking-actions">
                  {b.status === 'checked_in' && (
                    <button className="btn btn-danger" style={{ fontSize: '12px', padding: '7px 14px' }} onClick={() => checkout(b.id)}>
                      Check Out
                    </button>
                  )}
                </div>
              </div>
            ))}
            {bookings.length === 0 && (
              <div className="empty-state">No bookings found. Use the mobile app to check in guests.</div>
            )}
          </div>
        )
      }

      <style>{`
        .bookings-page { display: flex; flex-direction: column; gap: 24px; }
        .page-header { display: flex; align-items: flex-start; justify-content: space-between; flex-wrap: wrap; gap: 12px; }
        .page-title  { font-size: 24px; font-weight: 800; }
        .page-sub    { font-size: 13px; color: var(--text-muted); margin-top: 4px; }
        .filter-btn  { padding: 8px 16px; border-radius: var(--r-sm); background: var(--bg-glass); color: var(--text-secondary); font-size: 12px; font-weight: 600; border: 1px solid var(--border); cursor: pointer; transition: all var(--t-fast); }
        .filter-btn.active { background: var(--accent-dim); color: var(--accent); border-color: rgba(108,99,255,0.3); }
        .filter-btn:hover:not(.active) { background: var(--bg-glass-hover); color: var(--text-primary); }
        .booking-list { display: flex; flex-direction: column; gap: 10px; }
        .booking-row  { padding: 18px 22px; display: flex; align-items: center; gap: 20px; flex-wrap: wrap; transition: box-shadow var(--t-fast); }
        .booking-row:hover { box-shadow: var(--shadow-sm); }
        .booking-ref  { display: flex; align-items: center; gap: 10px; min-width: 160px; }
        .ref-code     { font-family: 'JetBrains Mono', monospace; font-size: 14px; font-weight: 700; color: var(--text-primary); }
        .booking-meta { display: flex; gap: 16px; flex-wrap: wrap; font-size: 12px; color: var(--text-muted); flex: 1; }
        .booking-guests { font-size: 13px; color: var(--text-secondary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 200px; }
        .booking-actions { margin-left: auto; }
        .empty-state { text-align: center; padding: 60px; color: var(--text-muted); font-size: 14px; }
        .loading-state { display: flex; align-items: center; gap: 12px; color: var(--text-muted); font-size: 14px; padding: 40px 0; justify-content: center; }
      `}</style>
    </div>
  )
}
