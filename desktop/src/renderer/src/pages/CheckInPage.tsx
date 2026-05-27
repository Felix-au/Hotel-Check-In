import { useEffect, useState } from 'react'

interface Guest { name: string; age: string; sex: string; is_primary: boolean }
interface Room   { id: number; room_number: string; room_type: string; floor: number; price_per_night: number }

const emptyGuest = (): Guest => ({ name: '', age: '', sex: '', is_primary: false })

export default function CheckInPage({ onDone }: { onDone: () => void }): JSX.Element {
  const [rooms, setRooms] = useState<Room[]>([])
  const [guests, setGuests] = useState<Guest[]>([{ ...emptyGuest(), is_primary: true }])
  const [roomIds, setRoomIds] = useState<number[]>([])
  const [checkOut, setCheckOut] = useState('')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    // Default check-out tomorrow
    const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1)
    setCheckOut(tomorrow.toISOString().slice(0, 10))
    window.api.rooms.available().then(setRooms)
  }, [])

  const addGuest = (): void => setGuests([...guests, emptyGuest()])
  const removeGuest = (i: number): void => {
    const updated = guests.filter((_, idx) => idx !== i)
    if (!updated.some(g => g.is_primary) && updated.length > 0) updated[0].is_primary = true
    setGuests(updated)
  }
  const updateGuest = (i: number, field: keyof Guest, value: any): void => {
    const updated = [...guests]
    if (field === 'is_primary') updated.forEach((g, idx) => g.is_primary = idx === i)
    else (updated[i] as any)[field] = value
    setGuests(updated)
  }

  const toggleRoom = (id: number): void =>
    setRoomIds(roomIds.includes(id) ? roomIds.filter(x => x !== id) : [...roomIds, id])

  const handleSubmit = async (): Promise<void> => {
    setError(''); setSuccess('')
    if (!guests.some(g => g.name.trim())) { setError('At least one guest with a name is required'); return }
    if (!roomIds.length) { setError('Select at least one room'); return }
    if (!checkOut) { setError('Check-out date is required'); return }

    setSaving(true)
    const res = await window.api.checkin.submit({
      guests: guests.filter(g => g.name.trim()).map(g => ({
        name: g.name.trim(),
        age: g.age ? parseInt(g.age) : undefined,
        sex: g.sex || undefined,
        is_primary: g.is_primary
      })),
      room_ids: roomIds,
      check_out_date: checkOut,
      notes: notes.trim() || undefined
    })
    setSaving(false)

    if (res?.error) { setError(res.error); return }
    setSuccess(`✓ Checked in! Booking reference: ${res.booking_reference}`)
    setTimeout(onDone, 2000)
  }

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">New Check-In</h1>
          <p className="page-sub">Register a guest or group</p>
        </div>
      </div>

      {error   && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 20, alignItems: 'start' }}>

        {/* Left: Guests */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="card card-pad">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ fontWeight: 700 }}>Guests ({guests.length})</h3>
              <button className="btn btn-ghost btn-sm" onClick={addGuest}>✚ Add Guest</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {guests.map((g, i) => (
                <div key={i} style={{
                  background: 'var(--bg-surface)', borderRadius: 10,
                  border: `1px solid ${g.is_primary ? 'var(--accent)' : 'var(--border)'}`,
                  padding: 16
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: g.is_primary ? 'var(--accent)' : 'var(--text-mute)' }}>
                      {g.is_primary ? '★ Primary Contact' : `Guest ${i + 1}`}
                    </span>
                    <div style={{ display: 'flex', gap: 8 }}>
                      {!g.is_primary && <button className="btn btn-ghost btn-sm" onClick={() => updateGuest(i, 'is_primary', true)}>Set Primary</button>}
                      {guests.length > 1 && <button className="btn btn-danger btn-sm" onClick={() => removeGuest(i)}>Remove</button>}
                    </div>
                  </div>
                  <div className="form-row-3">
                    <div className="form-group" style={{ gridColumn: '1/2' }}>
                      <label className="form-label">Name *</label>
                      <input className="form-input" value={g.name}
                        onChange={(e) => updateGuest(i, 'name', e.target.value)} placeholder="Full name" />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Age</label>
                      <input className="form-input" type="number" value={g.age}
                        onChange={(e) => updateGuest(i, 'age', e.target.value)} placeholder="—" />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Sex</label>
                      <select className="form-select" value={g.sex} onChange={(e) => updateGuest(i, 'sex', e.target.value)}>
                        <option value="">—</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Stay details */}
          <div className="card card-pad">
            <h3 style={{ fontWeight: 700, marginBottom: 16 }}>Stay Details</h3>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Check-Out Date *</label>
                <input className="form-input" type="date" value={checkOut}
                  onChange={(e) => setCheckOut(e.target.value)} min={new Date().toISOString().slice(0,10)} />
              </div>
            </div>
            <div className="form-group" style={{ marginTop: 14 }}>
              <label className="form-label">Notes</label>
              <textarea className="form-textarea" value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Special requests, early check-in, etc." />
            </div>
          </div>
        </div>

        {/* Right: Rooms */}
        <div className="card card-pad" style={{ position: 'sticky', top: 0 }}>
          <h3 style={{ fontWeight: 700, marginBottom: 4 }}>Select Room(s)</h3>
          <p style={{ fontSize: 12, color: 'var(--text-mute)', marginBottom: 16 }}>
            {roomIds.length ? `${roomIds.length} selected` : 'None selected'}
          </p>

          {!rooms.length
            ? <div className="empty-state" style={{ padding: '30px 0' }}>
                <div className="empty-icon" style={{ fontSize: 28 }}>🏠</div>
                No available rooms.<br/>Add rooms in the Rooms tab.
              </div>
            : <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {rooms.map((r) => {
                  const sel = roomIds.includes(r.id)
                  return (
                    <div key={r.id} onClick={() => toggleRoom(r.id)}
                      style={{
                        border: `1px solid ${sel ? 'var(--accent)' : 'var(--border)'}`,
                        borderRadius: 10, padding: 12, cursor: 'pointer',
                        background: sel ? 'var(--accent-dim)' : 'var(--bg-surface)',
                        transition: 'all 0.15s', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                      }}>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 15, color: sel ? 'var(--accent)' : 'var(--text-pri)' }}>
                          {r.room_number}
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--text-mute)', marginTop: 2 }}>
                          {r.room_type} · Floor {r.floor}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontWeight: 600, color: 'var(--accent)', fontSize: 13 }}>
                          ₹{Number(r.price_per_night).toLocaleString('en-IN')}
                        </div>
                        <div style={{ fontSize: 10, color: 'var(--text-mute)' }}>/night</div>
                      </div>
                    </div>
                  )
                })}
              </div>
          }

          <button className="btn btn-primary" style={{ width: '100%', marginTop: 20 }}
            onClick={handleSubmit} disabled={saving || !!success}>
            {saving ? <><div className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> Processing…</> : '✓ Confirm Check-In'}
          </button>
        </div>
      </div>
    </>
  )
}
