# MonM Development Startup Script
# Run from D:\monm

$ErrorActionPreference = "Stop"

Write-Host "MonM - Starting development environment" -ForegroundColor Green

# Ensure .env exists
if (-not (Test-Path "D:\monm\.env")) {
    Copy-Item "D:\monm\.env.example" "D:\monm\.env"
    Write-Host "Created .env from .env.example - please add your API keys" -ForegroundColor Yellow
}

# Init DB
Push-Location "D:\monm\backend"
node scripts/init-db.js
Pop-Location

# Start backend
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd D:\monm\backend; npm run dev" -PassThru

# Start frontend
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd D:\monm\frontend; npm run dev" -PassThru

Write-Host "Backend: http://localhost:3001" -ForegroundColor Cyan
Write-Host "Frontend PWA: http://localhost:3000" -ForegroundColor Cyan
