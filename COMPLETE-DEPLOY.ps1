# MonM - Complete Deploy Script
# Runs all automated steps. Manual steps are prompted.

$ErrorActionPreference = "Stop"
$root = "D:\monm"
$frontend = "$root\frontend"

Write-Host ""
Write-Host "=== MonM Complete Deploy ===" -ForegroundColor Green
Write-Host ""

# Step 1: Verify git & push status
Write-Host "1. Checking Git status..." -ForegroundColor Cyan
Set-Location $root
$remote = git remote get-url origin 2>$null
if (-not $remote) {
    Write-Host "   No remote configured. Run:" -ForegroundColor Yellow
    Write-Host "   git remote add origin https://github.com/YOUR_USERNAME/monm.git" -ForegroundColor White
    Write-Host "   git push -u origin main" -ForegroundColor White
    Write-Host ""
    $cont = Read-Host "Have you pushed to GitHub? (y/n)"
    if ($cont -ne "y") { exit 0 }
} else {
    Write-Host "   Remote: $remote" -ForegroundColor Gray
}

# Step 2: Build frontend
Write-Host "`n2. Building frontend..." -ForegroundColor Cyan
Set-Location $frontend
npm run build 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "Build failed." -ForegroundColor Red
    exit 1
}
Write-Host "   Build OK" -ForegroundColor Green

# Step 3: Open deployment pages
Write-Host "`n3. Opening deployment pages..." -ForegroundColor Cyan
Start-Process "https://app.netlify.com/start"
Start-Process "https://dashboard.render.com"
Write-Host "   Netlify and Render opened in browser." -ForegroundColor Gray

# Step 4: Netlify CLI deploy (optional)
Write-Host "`n4. Netlify CLI deploy..." -ForegroundColor Cyan
$token = $env:NETLIFY_AUTH_TOKEN
if ($token) {
    Write-Host "   NETLIFY_AUTH_TOKEN found. Deploying..." -ForegroundColor Gray
    Set-Location $root
    npx --yes netlify-cli deploy --build --prod 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   Deploy successful!" -ForegroundColor Green
    } else {
        Write-Host "   Deploy failed. Use Netlify web UI instead." -ForegroundColor Yellow
    }
} else {
    Write-Host "   No NETLIFY_AUTH_TOKEN. Use Netlify web UI:" -ForegroundColor Yellow
    Write-Host "   https://app.netlify.com/start -> Import monm repo" -ForegroundColor White
    Write-Host "   Or fetch token: https://app.netlify.com/user/applications#personal-access-tokens" -ForegroundColor White
}

Write-Host ""
Write-Host "=== Next Steps ===" -ForegroundColor Green
Write-Host "1. Render: Add PWA_URL and CORS_ORIGINS after Netlify deploy" -ForegroundColor White
Write-Host "2. Netlify: Add NEXT_PUBLIC_API_URL and NEXT_PUBLIC_WS_URL (your Render URL)" -ForegroundColor White
Write-Host "3. See DO-ALL-STEPS.md for full guide" -ForegroundColor White
Write-Host ""
