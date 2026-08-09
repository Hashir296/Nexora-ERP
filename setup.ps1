# EPS ERP setup — run AFTER freeing at least 2–3 GB on C:
# Right-click → Run with PowerShell, or: powershell -ExecutionPolicy Bypass -File D:\eps\setup.ps1

$ErrorActionPreference = 'Stop'
Write-Host 'Cleaning npm cache / temp…' -ForegroundColor Cyan
npm cache clean --force
Remove-Item "$env:TEMP\npm-*" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item "$env:LOCALAPPDATA\Temp\cursor-sandbox-cache" -Recurse -Force -ErrorAction SilentlyContinue

Write-Host 'Installing server…' -ForegroundColor Cyan
Set-Location D:\eps\server
npm install

Write-Host 'Installing client…' -ForegroundColor Cyan
Set-Location D:\eps\client
npm install

Write-Host 'Seeding MongoDB (eps_erp)…' -ForegroundColor Cyan
Set-Location D:\eps\server
npm run seed

Write-Host ''
Write-Host 'Done. Start in two terminals:' -ForegroundColor Green
Write-Host '  cd D:\eps\server; npm run dev'
Write-Host '  cd D:\eps\client; npm run dev'
Write-Host ''
Write-Host 'Login: admin@eps.local / Admin@123'
Write-Host 'App: http://localhost:5173'
