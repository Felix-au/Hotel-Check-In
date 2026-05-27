import { useEffect, useState } from 'react'

interface Booking {
  id: number; booking_reference: string; check_in_time: string
  check_out_date: string; status: string; notes?: string
  rooms?: string; guests?: string
}

const STATUS_BADGE: Record<string, string> = {
  checked_in: 'badge-green', checked_out: 'badge-navy', cancelled: 'badge-red'
}

export default function BookingsPage(): JSX.Element {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [error, setError] = useState('')
  const [checkouting, setCheckouting] = useState<number | null>(null)

  const load = async (): Promise<void> => {
    setLoading(true)
    try {
      const data = await window.api.bookings.list()
      setBookings(data)
      setError('')
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const handleCheckout = async (id: number, ref: string): Promise<void> => {
    if (!confirm(`Check out booking ${ref}? This will free the rooms.`)) return
    setCheckouting(id)
    const res = await window.api.bookings.checkout(id)
    setCheckouting(null)
    if (res?.error) alert(res.error)
    else load()
  }

  const filtered = filter === 'all' ? bookings : bookings.filter((b) => b.status === filter)

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Bookings</h1>
          <p className="page-sub">{bookings.filter(b => b.status === 'checked_in').length} active · {bookings.length} total</p>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={load}>↻ Refresh</button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {/* Filter */}
      <div style={{ display: 'flex', gap: 8 }}>
        {['all', 'checked_in', 'checked_out', 'cancelled'].map((f) => (
          <button key={f} className={`btn btn-sm ${filter === f ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setFilter(f)} style={{ textTransform: 'capitalize' }}>
            {f.replace('_', ' ')}
          </button>
        ))}
      </div>

      {loading
        ? <div style={{ textAlign: 'center', padding: 40 }}><div className="spinner" /></div>
        : (
          <div className="card">
            <div className="table-wrap">
              {!filtered.length
                ? <div className="empty-state"><div className="empty-icon">📋</div>No bookings found.</div>
                : (
                  <table>
                    <thead>
                      <tr>
                        <th>Reference</th><th>Guests</th><th>Rooms</th>
                        <th>Check-In</th><th>Check-Out</th><th>Status</th><th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map((b) => (
                        <tr key={b.id}>
                          <td>
                            <code style={{ color: 'var(--accent)', fontSize: 12 }}>{b.booking_reference}</code>
                          </td>
                          <td style={{ fontWeight: 600, maxWidth: 180 }}>{b.guests ?? '—'}</td>
                          <td style={{ color: 'var(--text-sec)' }}>{b.rooms ?? '—'}</td>
                          <td style={{ fontSize: 12, color: 'var(--text-sec)', whiteSpace: 'nowrap' }}>
                            {b.check_in_time?.slice(0, 16).replace('T', ' ')}
                          </td>
                          <td style={{ fontSize: 12, color: 'var(--text-sec)' }}>{b.check_out_date}</td>
                          <td>
                            <span className={`badge ${STATUS_BADGE[b.status] ?? 'badge-navy'}`}>
                              {b.status.replace('_', ' ')}
                            </span>
                          </td>
                          <td>
                            {b.status === 'checked_in' && (
                              <button
                                className="btn btn-ghost btn-sm"
                                onClick={() => handleCheckout(b.id, b.booking_reference)}
                                disabled={checkouting === b.id}
                              >
                                {checkouting === b.id ? <div className="spinner" style={{ width: 12, height: 12 }} /> : 'Check Out'}
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
            </div>
          </div>
        )}
    </>
  )
}
