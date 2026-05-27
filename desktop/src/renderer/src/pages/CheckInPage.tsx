import { useEffect, useState } from 'react'

/* ── Types ─────────────────────────────────────────────────────────────────── */
interface GuestForm {
  name: string; phone: string; age: string; sex: string
  photoPath: string | null; skipped: boolean
}
interface Room { id: number; room_number: string; room_type: string; floor: number; price_per_night: number }

type WizardStep = 'party-size' | 'guest' | 'document' | 'rooms' | 'confirm'

const blankGuest = (): GuestForm => ({ name: '', phone: '', age: '', sex: '', photoPath: null, skipped: false })

/* ── Step indicator ─────────────────────────────────────────────────────────── */
function StepBar({ step, partySize, guestIdx }: { step: WizardStep; partySize: number; guestIdx: number }) {
  const steps: { id: WizardStep | 'guest'; label: string }[] = [
    { id: 'party-size', label: 'Party Size' },
    { id: 'guest',      label: partySize > 0 ? `Guests (${Math.min(guestIdx + 1, partySize)}/${partySize})` : 'Guests' },
    { id: 'document',   label: 'Document' },
    { id: 'rooms',      label: 'Rooms' },
    { id: 'confirm',    label: 'Confirm' },
  ]

  const order: (WizardStep | 'guest')[] = ['party-size', 'guest', 'document', 'rooms', 'confirm']
  const currentIdx = order.indexOf(step)

  return (
    <div className="wizard-steps">
      {steps.map((s, i) => {
        const isDone    = i < currentIdx
        const isActive  = i === currentIdx
        return (
          <>
            <div key={s.id} className={`wstep ${isActive ? 'active' : ''} ${isDone ? 'done' : ''}`}>
              <div className="wstep-dot">{isDone ? '✓' : i + 1}</div>
              <span style={{ display: 'none', '@media (min-width: 600px)': { display: 'inline' } } as any}>
                {s.label}
              </span>
              <span style={{ fontSize: 11 }}>{s.label}</span>
            </div>
            {i < steps.length - 1 && (
              <div key={`line-${i}`} className={`wstep-line ${isDone ? 'done' : ''}`} />
            )}
          </>
        )
      })}
    </div>
  )
}

/* ── Photo upload button ─────────────────────────────────────────────────────── */
function PhotoPicker({ value, onChange, size = 'md' }: { value: string | null; onChange: (p: string | null) => void; size?: 'sm' | 'md' }) {
  const pick = async () => {
    const path = await window.api.dialog.pickImage()
    if (path) onChange(path)
  }
  return (
    <div className={`photo-upload ${size === 'sm' ? 'photo-upload-sm' : ''}`} onClick={pick} title="Click to pick photo">
      {value
        ? <img src={`file://${value}`} alt="photo" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
        : <>
            <span className="photo-upload-icon">📷</span>
            <span style={{ fontSize: 11, color: 'inherit', lineHeight: 1.4 }}>Click to add photo</span>
          </>
      }
      {value && (
        <button
          onClick={(e) => { e.stopPropagation(); onChange(null) }}
          style={{ position: 'absolute', top: 4, right: 4, background: 'rgba(0,0,0,0.6)', border: 'none', borderRadius: '50%', width: 22, height: 22, cursor: 'pointer', color: '#fff', fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >✕</button>
      )}
    </div>
  )
}

/* ── Main component ─────────────────────────────────────────────────────────── */
export default function CheckInPage({ onDone }: { onDone: () => void }): JSX.Element {
  const [step, setStep]           = useState<WizardStep>('party-size')
  const [partySize, setPartySize] = useState(0)
  const [customSize, setCustomSize] = useState('')
  const [guestIdx, setGuestIdx]   = useState(0)
  const [guests, setGuests]       = useState<GuestForm[]>([])
  const [documentPath, setDocumentPath] = useState<string | null>(null)
  const [rooms, setRooms]         = useState<Room[]>([])
  const [selectedRooms, setSelectedRooms] = useState<number[]>([])
  const [checkOut, setCheckOut]   = useState('')
  const [notes, setNotes]         = useState('')
  const [saving, setSaving]       = useState(false)
  const [error, setError]         = useState('')
  const [success, setSuccess]     = useState('')

  useEffect(() => {
    const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1)
    setCheckOut(tomorrow.toISOString().slice(0, 10))
  }, [])

  const confirmPartySize = (n: number) => {
    setPartySize(n)
    setGuests(Array.from({ length: n }, blankGuest))
    setStep('guest')
    setGuestIdx(0)
  }

  const currentGuest = guests[guestIdx]
  const updateGuest = (field: keyof GuestForm, value: any) => {
    setGuests((prev) => prev.map((g, i) => i === guestIdx ? { ...g, [field]: value } : g))
  }

  const nextGuest = (skipped = false) => {
    if (skipped) updateGuest('skipped', true)
    if (guestIdx < partySize - 1) {
      setGuestIdx(guestIdx + 1)
    } else {
      setStep('document')
    }
  }

  const skipAll = () => {
    // Mark all remaining guests as skipped
    setGuests((prev) => prev.map((g, i) => i >= guestIdx ? { ...g, skipped: true } : g))
    setStep('document')
  }

  const prevStep = () => {
    if (step === 'guest') {
      if (guestIdx > 0) setGuestIdx(guestIdx - 1)
      else setStep('party-size')
    } else if (step === 'document') {
      setGuestIdx(partySize - 1); setStep('guest')
    } else if (step === 'rooms') {
      setStep('document')
    } else if (step === 'confirm') {
      setStep('rooms')
    }
  }

  const toggleRoom = (id: number) =>
    setSelectedRooms((prev) => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])

  const handleSubmit = async () => {
    setError(''); setSaving(true)
    const res = await window.api.checkin.submit({
      guests: guests.map((g, i) => ({
        name: g.name.trim() || `Guest ${i + 1}`,
        phone: g.phone.trim() || undefined,
        age: g.age ? parseInt(g.age) : undefined,
        sex: g.sex || undefined,
        photo_path: g.photoPath || undefined,
        is_primary: i === 0
      })),
      room_ids: selectedRooms,
      check_out_date: checkOut,
      document_path: documentPath || undefined,
      notes: notes.trim() || undefined
    })
    setSaving(false)
    if (res?.error) { setError(res.error); return }
    setSuccess(`✓ Checked in! Reference: ${res.booking_reference}`)
    setTimeout(onDone, 2500)
  }

  // Load rooms when we reach the room step
  useEffect(() => {
    if (step === 'rooms') {
      window.api.rooms.available().then(setRooms)
    }
  }, [step])

  /* ── Render: Party Size ─────────────────────────────────────────────────── */
  if (step === 'party-size') return (
    <div className="wizard-wrap">
      <StepBar step={step} partySize={0} guestIdx={0} />
      <div className="card card-pad fade-in" style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 24 }}>
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 800, marginBottom: 6 }}>How many guests?</h2>
          <p style={{ color: 'var(--text-mute)', fontSize: 13 }}>Select the number of people checking in</p>
        </div>

        <div className="party-grid">
          {Array.from({ length: 12 }, (_, i) => i + 1).map((n) => (
            <button key={n} className={`party-btn ${partySize === n ? 'selected' : ''}`}
              onClick={() => setPartySize(n)}>{n}</button>
          ))}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ height: 1, flex: 1, background: 'var(--border)' }} />
          <span style={{ color: 'var(--text-mute)', fontSize: 12, fontWeight: 600 }}>or enter custom</span>
          <div style={{ height: 1, flex: 1, background: 'var(--border)' }} />
        </div>

        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <input
            className="form-input"
            type="number" min="1" max="50" placeholder="Enter number…"
            value={customSize}
            onChange={(e) => { setCustomSize(e.target.value); setPartySize(0) }}
            style={{ maxWidth: 160 }}
          />
          {customSize && parseInt(customSize) > 0 && (
            <button className="btn btn-ghost" onClick={() => setPartySize(parseInt(customSize))}>
              Select {customSize}
            </button>
          )}
        </div>

        {partySize > 0 && (
          <div className="alert alert-info">
            {partySize} {partySize === 1 ? 'guest' : 'guests'} selected
          </div>
        )}

        <div className="wizard-nav" style={{ marginTop: 'auto' }}>
          <button className="btn btn-ghost" onClick={() => onDone()}>✕ Cancel</button>
          <button className="btn btn-primary btn-lg"
            disabled={!partySize && !parseInt(customSize)}
            onClick={() => confirmPartySize(partySize || parseInt(customSize))}>
            Next → Guest Details
          </button>
        </div>
      </div>
    </div>
  )

  /* ── Render: Guest Form ─────────────────────────────────────────────────── */
  if (step === 'guest' && currentGuest) {
    const remaining = partySize - guestIdx - 1
    return (
      <div className="wizard-wrap">
        <StepBar step={step} partySize={partySize} guestIdx={guestIdx} />
        <div className="card card-pad fade-in" style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 800, marginBottom: 4 }}>
                Guest {guestIdx + 1} of {partySize}
                {guestIdx === 0 && <span style={{ background: 'var(--accent)', color: '#fff', fontSize: 10, fontWeight: 700, borderRadius: 4, padding: '2px 7px', marginLeft: 8, verticalAlign: 'middle' }}>PRIMARY</span>}
              </h2>
              <p style={{ color: 'var(--text-mute)', fontSize: 12 }}>All fields are optional — fill what's available</p>
            </div>
            {/* Guest progress dots */}
            <div className="guest-dots">
              {guests.map((g, i) => (
                <div key={i} className={`guest-dot ${i === guestIdx ? 'current' : g.name || g.photoPath ? 'done' : g.skipped ? 'skipped' : ''}`} />
              ))}
            </div>
          </div>

          {/* Form layout: photo left, fields right */}
          <div className="guest-form-layout">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'center' }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-mute)', textTransform: 'uppercase', letterSpacing: '0.6px' }}>Photo</span>
              <PhotoPicker
                value={currentGuest.photoPath}
                onChange={(p) => updateGuest('photoPath', p)}
              />
              <span style={{ fontSize: 10, color: 'var(--text-mute)', textAlign: 'center' }}>Optional</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input className="form-input" value={currentGuest.name}
                  onChange={(e) => updateGuest('name', e.target.value)}
                  placeholder="Leave blank to skip…" autoFocus />
              </div>
              <div className="form-group">
                <label className="form-label">Mobile Number</label>
                <input className="form-input" type="tel" value={currentGuest.phone}
                  onChange={(e) => updateGuest('phone', e.target.value)}
                  placeholder="+91 9876543210" />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Age</label>
                  <input className="form-input" type="number" min="1" max="120" value={currentGuest.age}
                    onChange={(e) => updateGuest('age', e.target.value)} placeholder="—" />
                </div>
                <div className="form-group">
                  <label className="form-label">Sex</label>
                  <select className="form-select" value={currentGuest.sex}
                    onChange={(e) => updateGuest('sex', e.target.value)}>
                    <option value="">— Select —</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Nav */}
          <div className="wizard-nav">
            <button className="btn btn-ghost" onClick={prevStep}>← Back</button>
            <div className="wizard-nav-right">
              {remaining > 0 && (
                <button className="btn btn-ghost btn-sm" onClick={skipAll}
                  title={`Skip ${remaining} remaining guest${remaining > 1 ? 's' : ''}`}>
                  Skip All ({remaining} remaining)
                </button>
              )}
              <button className="btn btn-ghost" onClick={() => nextGuest(true)}>
                Skip →
              </button>
              <button className="btn btn-primary" onClick={() => nextGuest(false)}>
                {guestIdx < partySize - 1 ? `Next Guest →` : 'Next: Document →'}
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  /* ── Render: Document Photo ─────────────────────────────────────────────── */
  if (step === 'document') return (
    <div className="wizard-wrap">
      <StepBar step={step} partySize={partySize} guestIdx={guestIdx} />
      <div className="card card-pad fade-in" style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 800, marginBottom: 4 }}>Group Document Photo</h2>
          <p style={{ color: 'var(--text-mute)', fontSize: 13 }}>
            Photograph the ID proof for this group (passport, Aadhaar, driving licence, etc.)
          </p>
        </div>

        <div
          className="doc-upload"
          onClick={async () => {
            const path = await window.api.dialog.pickImage()
            if (path) setDocumentPath(path)
          }}
        >
          {documentPath
            ? <img src={`file://${documentPath}`} alt="Document" />
            : <>
                <span className="doc-upload-icon">🪪</span>
                <span style={{ fontSize: 14, fontWeight: 600 }}>Click to attach document photo</span>
                <span style={{ fontSize: 12, color: 'var(--text-mute)' }}>JPG, PNG, WEBP supported</span>
              </>
          }
        </div>

        {documentPath && (
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <span className="badge badge-green">✓ Document attached</span>
            <button className="btn btn-ghost btn-sm" onClick={() => setDocumentPath(null)}>Remove</button>
          </div>
        )}

        <div className="wizard-nav">
          <button className="btn btn-ghost" onClick={prevStep}>← Back</button>
          <button className="btn btn-primary" onClick={() => setStep('rooms')}>
            Next: Room Selection →
          </button>
        </div>
      </div>
    </div>
  )

  /* ── Render: Room Selection ─────────────────────────────────────────────── */
  if (step === 'rooms') return (
    <div className="wizard-wrap">
      <StepBar step={step} partySize={partySize} guestIdx={guestIdx} />
      <div className="card card-pad fade-in" style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 800, marginBottom: 4 }}>Select Room(s)</h2>
            <p style={{ color: 'var(--text-mute)', fontSize: 13 }}>
              {selectedRooms.length > 0 ? `${selectedRooms.length} room${selectedRooms.length > 1 ? 's' : ''} selected` : 'Pick one or more available rooms'}
            </p>
          </div>
          <div className="form-group" style={{ minWidth: 180 }}>
            <label className="form-label">Check-Out Date *</label>
            <input className="form-input" type="date" value={checkOut}
              onChange={(e) => setCheckOut(e.target.value)}
              min={new Date().toISOString().slice(0, 10)} />
          </div>
        </div>

        {!rooms.length
          ? <div className="empty-state">
              <span className="empty-icon">🏠</span>
              No available rooms.<br/>Add rooms in the Rooms tab.
            </div>
          : <div className="room-grid">
              {rooms.map((r) => {
                const sel = selectedRooms.includes(r.id)
                return (
                  <div key={r.id} className={`room-card ${sel ? 'selected' : ''}`}
                    onClick={() => toggleRoom(r.id)} style={{ position: 'relative' }}>
                    {sel && <div className="room-card-check">✓</div>}
                    <div className="room-card-num">Room {r.room_number}</div>
                    <div className="room-card-type">{r.room_type} · Floor {r.floor}</div>
                    <div className="room-card-price">
                      ₹{Number(r.price_per_night).toLocaleString('en-IN')}<span style={{ fontSize: 10, fontWeight: 400, color: 'var(--text-mute)', fontFamily: 'Inter' }}>/night</span>
                    </div>
                  </div>
                )
              })}
            </div>
        }

        <div className="form-group">
          <label className="form-label">Notes (optional)</label>
          <textarea className="form-textarea" value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Special requests, early check-in, extra bed…" style={{ minHeight: 60 }} />
        </div>

        <div className="wizard-nav">
          <button className="btn btn-ghost" onClick={prevStep}>← Back</button>
          <button className="btn btn-primary" disabled={!selectedRooms.length || !checkOut}
            onClick={() => setStep('confirm')}>
            Review & Confirm →
          </button>
        </div>
      </div>
    </div>
  )

  /* ── Render: Confirm ────────────────────────────────────────────────────── */
  if (step === 'confirm') return (
    <div className="wizard-wrap">
      <StepBar step={step} partySize={partySize} guestIdx={guestIdx} />
      <div className="card card-pad fade-in" style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 20 }}>
        <h2 style={{ fontSize: 18, fontWeight: 800 }}>Review & Confirm</h2>

        {error   && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        {/* Guests */}
        <div className="confirm-section">
          <div className="confirm-label">Guests ({partySize})</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {guests.map((g, i) => (
              <div key={i} className="confirm-guest-card">
                <div className="confirm-guest-avatar">
                  {g.photoPath
                    ? <img src={`file://${g.photoPath}`} alt="guest" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                    : '👤'
                  }
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 13, color: g.skipped ? 'var(--text-mute)' : 'var(--text-pri)' }}>
                    {g.name || `Guest ${i + 1}`}
                    {i === 0 && <span style={{ marginLeft: 8, fontSize: 10, background: 'var(--accent)', color: '#fff', borderRadius: 4, padding: '1px 6px' }}>PRIMARY</span>}
                    {g.skipped && !g.name && <span style={{ marginLeft: 8, fontSize: 10, color: 'var(--text-mute)' }}>skipped</span>}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-mute)', marginTop: 2 }}>
                    {[g.phone, g.age && `Age ${g.age}`, g.sex].filter(Boolean).join(' · ') || 'No details provided'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Document */}
        {documentPath && (
          <div className="confirm-section">
            <div className="confirm-label">Document Photo</div>
            <img src={`file://${documentPath}`} alt="Document" style={{ maxHeight: 100, borderRadius: 8, border: '1px solid var(--border)', objectFit: 'contain', background: 'var(--bg-elevated)' }} />
          </div>
        )}

        {/* Rooms + dates */}
        <div className="confirm-section">
          <div className="confirm-label">Room Allocation</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {selectedRooms.map((id) => {
              const r = rooms.find(x => x.id === id)
              return r ? (
                <div key={id} style={{ background: 'var(--accent-dim)', border: '1px solid var(--border-hi)', borderRadius: 8, padding: '8px 14px' }}>
                  <div style={{ fontWeight: 800, color: 'var(--accent)' }}>Room {r.room_number}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-mute)' }}>{r.room_type}</div>
                </div>
              ) : null
            })}
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-sec)', marginTop: 8 }}>
            Check-out: <strong>{checkOut}</strong>
          </div>
          {notes && <div style={{ fontSize: 12, color: 'var(--text-mute)', marginTop: 4 }}>Note: {notes}</div>}
        </div>

        <div className="wizard-nav">
          <button className="btn btn-ghost" onClick={prevStep} disabled={saving}>← Back</button>
          <button className="btn btn-primary btn-lg" onClick={handleSubmit} disabled={saving || !!success}>
            {saving
              ? <><div className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> Processing…</>
              : '✓ Confirm Check-In'}
          </button>
        </div>
      </div>
    </div>
  )

  return <div />
}
