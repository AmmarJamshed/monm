# MonM - Deploy to Netlify
# Prerequisites: GitHub repo pushed, Netlify account
# Run: .\deploy-to-netlify.ps1

$ErrorActionPreference = "Stop"
$root = "D:\monm"
$frontend = "$root\frontend"

Write-Host "=== MonM Netlify Deploy ===" -ForegroundColor Green

# Step 1: Ensure frontend is built
Write-Host "`n1. Building frontend..." -ForegroundColor Cyan
Set-Location $frontend
npm run build 2>&1 | Out-Null
if ($LASTEXITCODE -ne 0) {
    Write-Host "Build failed. Run: cd $frontend; npm run build" -ForegroundColor Red
    exit 1
}

# Step 2: Deploy with Netlify CLI
Write-Host "`n2. Deploying to Netlify (from repo root)..." -ForegroundColor Cyan
Set-Location $root

# Use npx to run netlify - will prompt for login if needed
npx --yes netlify-cli deploy --build --prod

Write-Host "`nIf deploy succeeded, your site is live!" -ForegroundColor Green
Write-Host "Set NEXT_PUBLIC_API_URL and NEXT_PUBLIC_WS_URL in Netlify Site Settings > Environment" -ForegroundColor Yellow
