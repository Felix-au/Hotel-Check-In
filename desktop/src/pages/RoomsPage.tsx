import { useEffect, useState } from 'react'

const API = 'http://localhost:8080'

interface Room {
  id: number
  room_number: string
  room_type: string
  floor: number
  status: 'available' | 'occupied' | 'maintenance' | 'checkout'
  price_per_night: number
  booking_reference?: string
  check_out_date?: string
  guest_names?: string
}

const statusMeta: Record<string, { label: string; badgeClass: string; dot: string }> = {
  available:   { label: 'Available',   badgeClass: 'badge-green',  dot: '#22d09a' },
  occupied:    { label: 'Occupied',    badgeClass: 'badge-red',    dot: '#ff5e7d' },
  maintenance: { label: 'Maintenance', badgeClass: 'badge-amber',  dot: '#ffb347' },
  checkout:    { label: 'Checkout',    badgeClass: 'badge-blue',   dot: '#4fa3ff' },
}

export default function RoomsPage() {
  const [rooms, setRooms]       = useState<Room[]>([])
  const [loading, setLoading]   = useState(true)
  const [showAdd, setShowAdd]   = useState(false)
  const [form, setForm]         = useState({ room_number: '', room_type: 'Standard', floor: 1, price_per_night: 0, notes: '' })
  const [saving, setSaving]     = useState(false)
  const [filterStatus, setFilter] = useState('all')

  const fetchRooms = async () => {
    try {
      const res = await fetch(`${API}/api/rooms`)
      const data = await res.json()
      setRooms(data.rooms ?? [])
    } catch { /* silent */ }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchRooms() }, [])

  const handleAddRoom = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      await fetch(`${API}/api/rooms`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      setShowAdd(false)
      setForm({ room_number: '', room_type: 'Standard', floor: 1, price_per_night: 0, notes: '' })
      fetchRooms()
    } finally { setSaving(false) }
  }

  const updateStatus = async (id: number, status: string) => {
    await fetch(`${API}/api/rooms/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    fetchRooms()
  }

  const filtered = filterStatus === 'all' ? rooms : rooms.filter(r => r.status === filterStatus)

  return (
    <div className="rooms-page animate-fade">
      <div className="page-header">
        <div>
          <h1 className="page-title">Rooms</h1>
          <p className="page-sub">{rooms.length} total rooms registered</p>
        </div>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <select value={filterStatus} onChange={e => setFilter(e.target.value)} style={{ width: 'auto', padding: '9px 14px' }}>
            <option value="all">All Rooms</option>
            <option value="available">Available</option>
            <option value="occupied">Occupied</option>
            <option value="maintenance">Maintenance</option>
            <option value="checkout">Checkout</option>
          </select>
          <button className="btn btn-primary" onClick={() => setShowAdd(true)}>+ Add Room</button>
        </div>
      </div>

      {showAdd && (
        <div className="modal-overlay" onClick={() => setShowAdd(false)}>
          <form className="modal glass-card" onClick={e => e.stopPropagation()} onSubmit={handleAddRoom}>
            <h2 className="modal-title">Register New Room</h2>
            <div className="form-grid">
              <div className="form-field">
                <label>Room Number *</label>
                <input required value={form.room_number} onChange={e => setForm(f => ({ ...f, room_number: e.target.value }))} placeholder="101" />
              </div>
              <div className="form-field">
                <label>Room Type</label>
                <select value={form.room_type} onChange={e => setForm(f => ({ ...f, room_type: e.target.value }))}>
                  {['Standard', 'Deluxe', 'Suite', 'Presidential', 'Dormitory'].map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div className="form-field">
                <label>Floor</label>
                <input type="number" min={1} value={form.floor} onChange={e => setForm(f => ({ ...f, floor: Number(e.target.value) }))} />
              </div>
              <div className="form-field">
                <label>Price/Night (₹)</label>
                <input type="number" min={0} step={0.01} value={form.price_per_night} onChange={e => setForm(f => ({ ...f, price_per_night: Number(e.target.value) }))} />
              </div>
              <div className="form-field full">
                <label>Notes</label>
                <input value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Optional notes..." />
              </div>
            </div>
            <div className="modal-actions">
              <button type="button" className="btn btn-ghost" onClick={() => setShowAdd(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Register Room'}</button>
            </div>
          </form>
        </div>
      )}

      {loading
        ? <div className="loading-state"><span className="animate-spin">⟳</span> Loading rooms...</div>
        : (
          <div className="rooms-grid">
            {filtered.map(room => {
              const meta = statusMeta[room.status] ?? statusMeta.available
              return (
                <div key={room.id} className={`room-card glass-card ${room.status}`}>
                  <div className="room-header">
                    <div className="room-number">
                      <span className="room-dot" style={{ background: meta.dot }} />
                      {room.room_number}
                    </div>
                    <span className={`badge ${meta.badgeClass}`}>{meta.label}</span>
                  </div>
                  <div className="room-type">{room.room_type} · Floor {room.floor}</div>
                  {room.guest_names && <div className="room-guests">{room.guest_names}</div>}
                  {room.check_out_date && <div className="room-checkout">Out: {room.check_out_date}</div>}
                  <div className="room-price">₹{Number(room.price_per_night).toLocaleString('en-IN')}<span>/night</span></div>
                  <div className="room-actions">
                    {room.status !== 'available' && (
                      <button className="btn btn-ghost" style={{ fontSize: '11px', padding: '6px 12px' }} onClick={() => updateStatus(room.id, 'available')}>Mark Available</button>
                    )}
                    {room.status === 'available' && (
                      <button className="btn btn-ghost" style={{ fontSize: '11px', padding: '6px 12px' }} onClick={() => updateStatus(room.id, 'maintenance')}>Maintenance</button>
                    )}
                  </div>
                </div>
              )
            })}
            {filtered.length === 0 && (
              <div className="empty-state">No rooms found. Add your first room to get started.</div>
            )}
          </div>
        )
      }

      <style>{`
        .rooms-page { display: flex; flex-direction: column; gap: 24px; }
        .page-header { display: flex; align-items: flex-start; justify-content: space-between; flex-wrap: wrap; gap: 12px; }
        .page-title  { font-size: 24px; font-weight: 800; }
        .page-sub    { font-size: 13px; color: var(--text-muted); margin-top: 4px; }
        .rooms-grid  { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 14px; }
        .room-card   { padding: 18px; display: flex; flex-direction: column; gap: 10px; transition: transform var(--t-fast), box-shadow var(--t-fast); }
        .room-card:hover { transform: translateY(-2px); box-shadow: var(--shadow-md); }
        .room-header { display: flex; align-items: center; justify-content: space-between; }
        .room-number { display: flex; align-items: center; gap: 8px; font-size: 22px; font-weight: 800; color: var(--text-primary); }
        .room-dot    { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
        .room-type   { font-size: 12px; color: var(--text-muted); }
        .room-guests { font-size: 12px; color: var(--text-secondary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .room-checkout { font-size: 11px; color: var(--amber); }
        .room-price  { font-size: 15px; font-weight: 700; color: var(--text-primary); }
        .room-price span { font-size: 11px; color: var(--text-muted); font-weight: 400; }
        .room-actions { margin-top: 4px; }
        .empty-state { grid-column: 1/-1; text-align: center; padding: 60px; color: var(--text-muted); font-size: 14px; }
        .loading-state { display: flex; align-items: center; gap: 12px; color: var(--text-muted); font-size: 14px; padding: 40px 0; justify-content: center; }
        .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.7); backdrop-filter: blur(6px); display: flex; align-items: flex-start; justify-content: center; padding: 48px 16px; z-index: 100; overflow-y: auto; }
        .modal { padding: 28px; width: 480px; max-width: 95vw; max-height: calc(100vh - 96px); overflow-y: auto; }
        .modal-title { font-size: 18px; font-weight: 700; margin-bottom: 20px; }
        .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
        .form-field { display: flex; flex-direction: column; gap: 6px; }
        .form-field.full { grid-column: 1/-1; }
        .form-field label { font-size: 12px; color: var(--text-secondary); font-weight: 500; }
        .modal-actions { display: flex; justify-content: flex-end; gap: 10px; margin-top: 20px; }
      `}</style>
    </div>
  )
}
