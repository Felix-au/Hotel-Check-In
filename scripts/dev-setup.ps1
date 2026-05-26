# dev-setup.ps1
# One-shot developer environment bootstrap for the Hotel Check-In project.
# Run from repository root: .\scripts\dev-setup.ps1

$ErrorActionPreference = "Stop"
$Root = Split-Path $PSScriptRoot -Parent

Write-Host "`n╔════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host   "║  Hotel Check-In — Developer Setup         ║" -ForegroundColor Cyan
Write-Host   "╚════════════════════════════════════════════╝`n" -ForegroundColor Cyan

# ── 1. Check Node.js ────────────────────────────────────────────────────────
Write-Host "[1/4] Checking Node.js..." -ForegroundColor Yellow
try {
    $nodeVer = node --version
    Write-Host "      ✓ Node.js $nodeVer detected" -ForegroundColor Green
} catch {
    Write-Host "      ✗ Node.js not found. Install from https://nodejs.org (LTS)" -ForegroundColor Red
    exit 1
}

# ── 2. Install Desktop dependencies ─────────────────────────────────────────
Write-Host "`n[2/4] Installing desktop dependencies..." -ForegroundColor Yellow
Set-Location "$Root\desktop"
npm install
Write-Host "      ✓ Desktop node_modules installed" -ForegroundColor Green

# ── 3. Install Mobile dependencies ──────────────────────────────────────────
Write-Host "`n[3/4] Installing mobile dependencies..." -ForegroundColor Yellow
Set-Location "$Root\mobile"
npm install
Write-Host "      ✓ Mobile node_modules installed" -ForegroundColor Green

# ── 4. Download MariaDB portable binaries ────────────────────────────────────
Write-Host "`n[4/4] Setting up portable MariaDB engine..." -ForegroundColor Yellow
Set-Location $Root
& "$PSScriptRoot\setup-mariadb.ps1"

# ── Done ────────────────────────────────────────────────────────────────────
Set-Location $Root
Write-Host "`n╔════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host   "║  Setup complete! Next steps:               ║" -ForegroundColor Green
Write-Host   "║                                            ║" -ForegroundColor Green
Write-Host   "║  Desktop:  cd desktop && npm run dev      ║" -ForegroundColor Green
Write-Host   "║  Mobile:   cd mobile  && npx expo start   ║" -ForegroundColor Green
Write-Host   "╚════════════════════════════════════════════╝`n" -ForegroundColor Green
