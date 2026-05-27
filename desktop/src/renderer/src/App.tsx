import { useState, useEffect } from 'react'
import './index.css'
import SetupPage from './pages/SetupPage'
import DashboardPage from './pages/DashboardPage'
import RoomsPage from './pages/RoomsPage'
import BookingsPage from './pages/BookingsPage'
import CheckInPage from './pages/CheckInPage'
import PairPage from './pages/PairPage'

type Page = 'setup' | 'dashboard' | 'rooms' | 'bookings' | 'checkin' | 'pair'

const NAV = [
  { id: 'dashboard', label: 'Dashboard', icon: '⊞' },
  { id: 'rooms',     label: 'Rooms',     icon: '🏠' },
  { id: 'bookings',  label: 'Bookings',  icon: '📋' },
  { id: 'checkin',   label: 'Check-In',  icon: '✚' },
  { id: 'pair',      label: 'Pair',      icon: '📡' },
] as const

export default function App(): JSX.Element {
  const [page, setPage] = useState<Page>('dashboard')
  const [booting, setBooting] = useState(true)
  const [needsSetup, setNeedsSetup] = useState(false)

  useEffect(() => {
    window.api.boot().then((res) => {
      setNeedsSetup(res.needsSetup)
      setBooting(false)
    })
  }, [])

  if (booting) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', gap: 14 }}>
        <div className="spinner" />
        <span style={{ color: 'var(--text-mute)', fontSize: 14 }}>Starting SyncStay…</span>
      </div>
    )
  }

  if (needsSetup) {
    return <SetupPage onDone={() => setNeedsSetup(false)} />
  }

  const renderPage = (): JSX.Element => {
    switch (page) {
      case 'dashboard': return <DashboardPage onNavigate={(p) => setPage(p as Page)} />
      case 'rooms':     return <RoomsPage />
      case 'bookings':  return <BookingsPage />
      case 'checkin':   return <CheckInPage onDone={() => setPage('bookings')} />
      case 'pair':      return <PairPage />
      default:          return <DashboardPage onNavigate={(p) => setPage(p as Page)} />
    }
  }

  return (
    <div className="app-shell">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-brand">
          <img src="../../../../logo.png" alt="SyncStay" className="sidebar-logo" />
          <div>
            <div className="sidebar-name">SyncStay</div>
            <div className="sidebar-tag">One platform. Every device.</div>
          </div>
        </div>

        <nav className="sidebar-nav">
          {NAV.map((item) => (
            <div
              key={item.id}
              className={`nav-item ${page === item.id ? 'active' : ''}`}
              onClick={() => setPage(item.id as Page)}
            >
              <span className="nav-icon">{item.icon}</span>
              {item.label}
            </div>
          ))}
        </nav>

        <div className="sidebar-footer">
          SyncStay v1.0.0
        </div>
      </aside>

      {/* Content */}
      <main className="main-content fade-in" key={page}>
        {renderPage()}
      </main>
    </div>
  )
}
