# MonM - Full Automated Deploy
# Requires: GITHUB_TOKEN, NETLIFY_AUTH_TOKEN (create at links below)
# Run: $env:GITHUB_TOKEN="ghp_xxx"; $env:NETLIFY_AUTH_TOKEN="nfp_xxx"; .\FULL-DEPLOY.ps1

$ErrorActionPreference = "Stop"
$root = "D:\monm"
$frontend = "$root\frontend"
$repoName = "monm"

Write-Host "`n=== MonM Full Deploy ===" -ForegroundColor Green

# 1. Build frontend
Write-Host "`n[1/5] Building frontend..." -ForegroundColor Cyan
Set-Location $frontend
npm run build 2>&1 | Out-Null
if ($LASTEXITCODE -ne 0) { Write-Host "Build failed" -ForegroundColor Red; exit 1 }
Write-Host "   OK" -ForegroundColor Green
Set-Location $root

# 2. Create GitHub repo and push
$gt = $env:GITHUB_TOKEN
if ($gt) {
    Write-Host "`n[2/5] Creating GitHub repo and pushing..." -ForegroundColor Cyan
    $user = (Invoke-RestMethod -Headers @{Authorization="token $gt"} -Uri "https://api.github.com/user").login
    $exists = try { Invoke-RestMethod -Headers @{Authorization="token $gt"} -Uri "https://api.github.com/repos/$user/$repoName" } catch { $null }
    if ($exists) {
        Write-Host "   Repo exists, pushing..." -ForegroundColor Gray
    } else {
        Invoke-RestMethod -Method Post -Headers @{Authorization="token $gt"; "Content-Type"="application/json"} `
            -Uri "https://api.github.com/user/repos" `
            -Body (@{name=$repoName; description="MonM secure messaging PWA"; private=$false} | ConvertTo-Json)
        Write-Host "   Repo created" -ForegroundColor Gray
    }
    git remote remove origin 2>$null
    git remote add origin "https://${gt}@github.com/${user}/${repoName}.git"
    git push -u origin main 2>&1 | Out-Null
    Write-Host "   OK - https://github.com/$user/$repoName" -ForegroundColor Green
} else {
    Write-Host "`n[2/5] GITHUB_TOKEN not set. Create at: https://github.com/settings/tokens (repo scope)" -ForegroundColor Yellow
    Write-Host "   Skipping. Push manually: git remote add origin https://github.com/USER/monm.git; git push -u origin main" -ForegroundColor Gray
}

# 3. Render - open dashboard (requires manual connect)
Write-Host "`n[3/5] Render backend..." -ForegroundColor Cyan
Start-Process "https://dashboard.render.com/select-repo?type=blueprint"
Write-Host "   Open Render > New Blueprint > Connect monm repo > Apply" -ForegroundColor Gray
Write-Host "   Copy your API URL (e.g. https://monm-api-xxx.onrender.com)" -ForegroundColor Gray

# 4. Netlify - create site and deploy
$nt = $env:NETLIFY_AUTH_TOKEN
if ($nt) {
    Write-Host "`n[4/5] Creating Netlify site..." -ForegroundColor Cyan
    $apiUrl = $env:RENDER_API_URL ?? "https://monm-api.onrender.com"
    $wsUrl = $apiUrl -replace "^https","wss"
    $site = Invoke-RestMethod -Method Post -Headers @{Authorization="Bearer $nt"; "Content-Type"="application/json"} `
        -Uri "https://api.netlify.com/api/v1/sites" `
        -Body (@{name="monm"; account_slug=(Invoke-RestMethod -Headers @{Authorization="Bearer $nt"} -Uri "https://api.netlify.com/api/v1/accounts").slug} | ConvertTo-Json -Compress)
    Write-Host "   Site created: $($site.url)" -ForegroundColor Green
    # Trigger deploy from GitHub - need to link repo
    Write-Host "   Link repo at: $($site.admin_url)/settings/deploys#build" -ForegroundColor Gray
    Start-Process $site.admin_url
    Write-Host "   Add env vars: NEXT_PUBLIC_API_URL=$apiUrl, NEXT_PUBLIC_WS_URL=$wsUrl" -ForegroundColor Gray
} else {
    Write-Host "`n[4/5] NETLIFY_AUTH_TOKEN not set. Create at: https://app.netlify.com/user/applications#personal-access-tokens" -ForegroundColor Yellow
    Start-Process "https://app.netlify.com/start"
    Write-Host "   Import monm repo, add env vars for API/WS URLs" -ForegroundColor Gray
}

# 5. Summary
Write-Host "`n[5/5] Next steps:" -ForegroundColor Cyan
Write-Host "   1. After Render deploys: set PWA_URL and CORS_ORIGINS to your Netlify URL" -ForegroundColor White
Write-Host "   2. After Netlify deploys: set NEXT_PUBLIC_API_URL and NEXT_PUBLIC_WS_URL to your Render URL" -ForegroundColor White
Write-Host "   3. Share your Netlify URL - users can install as PWA" -ForegroundColor White
Write-Host ""
