import { useEffect, useState } from 'react'

const API = 'http://localhost:8080'

interface ServerInfo {
  local_ip: string
  port: number
  pairing_url: string
  qr_code: string
}

export default function PairingPage() {
  const [info, setInfo]       = useState<ServerInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState('')

  const fetchInfo = async () => {
    setLoading(true)
    try {
      const res = await fetch(`${API}/api/settings/server-info`)
      const data = await res.json()
      setInfo(data)
      setError('')
    } catch {
      setError('Cannot reach API server. Make sure the desktop app started correctly.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchInfo() }, [])

  const copyUrl = () => {
    if (info?.pairing_url) {
      navigator.clipboard.writeText(info.pairing_url)
    }
  }

  return (
    <div className="pairing-page animate-fade">
      <div className="page-header">
        <div>
          <h1 className="page-title">Device Pairing</h1>
          <p className="page-sub">Scan the QR code on the mobile app or enter the URL manually</p>
        </div>
        <button className="btn btn-ghost" onClick={fetchInfo}>↻ Refresh</button>
      </div>

      {error && <div className="alert-error">{error}</div>}

      {loading
        ? <div className="loading-state"><span className="animate-spin">⟳</span> Fetching server info...</div>
        : info && (
          <div className="pairing-layout">
            {/* QR code panel */}
            <div className="qr-card glass-card">
              <p className="qr-label">Scan with the Hotel Check-In APK</p>
              <div className="qr-wrapper">
                <img src={info.qr_code} alt="Pairing QR code" className="qr-image" />
              </div>
              <p className="qr-hint">Point the APK camera at this code to instantly pair</p>
            </div>

            {/* Connection details */}
            <div className="conn-details">
              <div className="conn-card glass-card">
                <h3 className="conn-title">Local Network (LAN)</h3>
                <p className="conn-desc">For devices on the same Wi-Fi or Ethernet network as this computer.</p>
                <div className="conn-url">
                  <code>{info.pairing_url}</code>
                  <button className="btn btn-ghost copy-btn" onClick={copyUrl} title="Copy URL">⎘</button>
                </div>
                <div className="conn-meta">
                  <span className="meta-pill">IP: <strong>{info.local_ip}</strong></span>
                  <span className="meta-pill">Port: <strong>{info.port}</strong></span>
                </div>
              </div>

              <div className="conn-card glass-card">
                <h3 className="conn-title">Wide Area Network (WAN)</h3>
                <p className="conn-desc">For remote branches connecting over the internet. Configure one of:</p>
                <div className="wan-options">
                  <div className="wan-option">
                    <div className="wan-badge badge badge-green">FREE</div>
                    <div className="wan-text">
                      <strong>DuckDNS + Port Forwarding</strong>
                      <span>Register a free domain at duckdns.org, then forward port <code>{info.port}</code> on your router to this machine's IP <code>{info.local_ip}</code>.</span>
                    </div>
                  </div>
                  <div className="wan-option">
                    <div className="wan-badge badge badge-accent">FREE · 100 devices</div>
                    <div className="wan-text">
                      <strong>Tailscale VPN</strong>
                      <span>Install Tailscale on this PC and all mobile devices. They will form a private secure mesh network — no router config needed.</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="conn-card glass-card status-card">
                <h3 className="conn-title">Server Status</h3>
                <div className="status-row">
                  <span className="status-dot active" />
                  <span>API Server running on port <strong>{info.port}</strong></span>
                </div>
                <div className="status-row">
                  <span className="status-dot active" />
                  <span>Accepting connections from <strong>0.0.0.0</strong> (all interfaces)</span>
                </div>
              </div>
            </div>
          </div>
        )
      }

      <style>{`
        .pairing-page { display: flex; flex-direction: column; gap: 28px; }
        .page-header { display: flex; align-items: flex-start; justify-content: space-between; flex-wrap: wrap; gap: 12px; }
        .page-title  { font-size: 24px; font-weight: 800; }
        .page-sub    { font-size: 13px; color: var(--text-muted); margin-top: 4px; }
        .alert-error { padding: 14px 18px; background: var(--red-dim); border: 1px solid rgba(255,94,125,0.25); border-radius: var(--r-md); color: var(--red); font-size: 13px; }
        .loading-state { display: flex; align-items: center; gap: 12px; color: var(--text-muted); font-size: 14px; padding: 40px 0; justify-content: center; }

        .pairing-layout { display: grid; grid-template-columns: 300px 1fr; gap: 20px; align-items: start; }
        @media (max-width: 860px) { .pairing-layout { grid-template-columns: 1fr; } }

        .qr-card { padding: 28px; display: flex; flex-direction: column; align-items: center; gap: 16px; text-align: center; }
        .qr-label { font-size: 13px; color: var(--text-secondary); font-weight: 500; }
        .qr-wrapper { padding: 12px; background: #0d0d0f; border-radius: var(--r-md); border: 2px solid var(--accent); box-shadow: 0 0 30px var(--accent-glow); }
        .qr-image { display: block; width: 220px; height: 220px; border-radius: 4px; }
        .qr-hint { font-size: 11px; color: var(--text-muted); max-width: 220px; line-height: 1.6; }

        .conn-details { display: flex; flex-direction: column; gap: 14px; }
        .conn-card { padding: 22px; display: flex; flex-direction: column; gap: 12px; }
        .conn-title { font-size: 15px; font-weight: 700; color: var(--text-primary); }
        .conn-desc  { font-size: 12px; color: var(--text-muted); line-height: 1.6; }
        .conn-url   { display: flex; align-items: center; gap: 10px; background: var(--bg-base); border: 1px solid var(--border); border-radius: var(--r-sm); padding: 10px 14px; }
        .conn-url code { flex: 1; font-family: 'JetBrains Mono', monospace; font-size: 13px; color: var(--accent); word-break: break-all; }
        .copy-btn   { padding: 6px 10px; flex-shrink: 0; font-size: 16px; }
        .conn-meta  { display: flex; gap: 10px; flex-wrap: wrap; }
        .meta-pill  { background: var(--bg-glass); border: 1px solid var(--border); border-radius: 99px; padding: 4px 12px; font-size: 11px; color: var(--text-muted); }
        .meta-pill strong { color: var(--text-primary); }

        .wan-options { display: flex; flex-direction: column; gap: 12px; }
        .wan-option  { display: flex; gap: 12px; align-items: flex-start; }
        .wan-badge   { white-space: nowrap; flex-shrink: 0; font-size: 10px; }
        .wan-text    { display: flex; flex-direction: column; gap: 4px; font-size: 13px; }
        .wan-text strong { color: var(--text-primary); }
        .wan-text span   { font-size: 12px; color: var(--text-muted); line-height: 1.6; }
        .wan-text code   { background: var(--bg-glass); border-radius: 4px; padding: 1px 5px; font-size: 11px; color: var(--accent); font-family: 'JetBrains Mono', monospace; }

        .status-card { }
        .status-row  { display: flex; align-items: center; gap: 10px; font-size: 13px; color: var(--text-secondary); }
        .status-dot  { width: 8px; height: 8px; border-radius: 50%; background: var(--text-muted); flex-shrink: 0; }
        .status-dot.active { background: var(--green); box-shadow: 0 0 8px var(--green); }
      `}</style>
    </div>
  )
}
