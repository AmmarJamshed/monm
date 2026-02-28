# MonM - Deploy to Render + Netlify
# Run: $env:NETLIFY_AUTH_TOKEN="nfp_xxx"; $env:RENDER_API_KEY="rnd_xxx"; .\DEPLOY-NOW.ps1
# Or just: .\DEPLOY-NOW.ps1 (will push only; use Dashboard to manually trigger if needed)

$ErrorActionPreference = "Stop"
$root = "D:\monm"
$siteName = "monm-secure-messaging"

Write-Host "`n=== MonM Deploy ===" -ForegroundColor Green

# 1. Ensure push
Set-Location $root
$status = git status --porcelain
if ($status) {
    Write-Host "`nUncommitted changes. Commit first:" -ForegroundColor Yellow
    git status
    exit 1
}
Write-Host "`n[1] Pushing to GitHub..." -ForegroundColor Cyan
$prevErr = $ErrorActionPreference
$ErrorActionPreference = "SilentlyContinue"
git push origin master 2>&1 | Out-Null
$ec = $LASTEXITCODE
$ErrorActionPreference = $prevErr
if ($ec -ne 0) { Write-Host "Push failed" -ForegroundColor Red; exit 1 }
Write-Host "   OK" -ForegroundColor Green

# 2. Netlify - trigger build via API (builds on Netlify servers, avoids local EPERM)
$nt = $env:NETLIFY_AUTH_TOKEN
if ($nt) {
    Write-Host "`n[2] Triggering Netlify build..." -ForegroundColor Cyan
    try {
        $sites = Invoke-RestMethod -Uri "https://api.netlify.com/api/v1/sites" -Headers @{Authorization="Bearer $nt"}
        $site = $sites | Where-Object { $_.name -eq $siteName } | Select-Object -First 1
        if ($site) {
            Invoke-RestMethod -Method Post -Uri "https://api.netlify.com/api/v1/sites/$($site.id)/builds" -Headers @{Authorization="Bearer $nt"; "Content-Type"="application/json"} -Body "{}"
            Write-Host "   Netlify build triggered: https://app.netlify.com/sites/$siteName/deploys" -ForegroundColor Green
        } else {
            Write-Host "   Site not found. Trigger manually: https://app.netlify.com" -ForegroundColor Yellow
        }
    } catch {
        Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Yellow
        Write-Host "   Trigger manually: https://app.netlify.com/sites/$siteName/deploys" -ForegroundColor Gray
    }
} else {
    Write-Host "`n[2] NETLIFY_AUTH_TOKEN not set." -ForegroundColor Yellow
    Write-Host "   Trigger build: https://app.netlify.com/sites/$siteName/deploys -> Trigger deploy" -ForegroundColor Gray
}

# 3. Render - trigger deploy via API
$rk = $env:RENDER_API_KEY
if ($rk) {
    Write-Host "`n[3] Triggering Render deploy..." -ForegroundColor Cyan
    try {
        $list = Invoke-RestMethod -Uri "https://api.render.com/v1/services?limit=50" -Headers @{Authorization="Bearer $rk"; Accept="application/json"}
        $monm = $list | ForEach-Object { $_.service } | Where-Object { $_.name -match "monm" } | Select-Object -First 1
        if ($monm) {
            Invoke-RestMethod -Method Post -Uri "https://api.render.com/v1/services/$($monm.id)/deploys" -Headers @{Authorization="Bearer $rk"; "Content-Type"="application/json"}
            Write-Host "   Render deploy triggered" -ForegroundColor Green
        } else {
            Write-Host "   monm-api service not found. Trigger manually: https://dashboard.render.com" -ForegroundColor Yellow
        }
    } catch {
        Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Yellow
        Write-Host "   Trigger manually: https://dashboard.render.com" -ForegroundColor Gray
    }
} else {
    Write-Host "`n[3] RENDER_API_KEY not set." -ForegroundColor Yellow
    Write-Host "   Create key: https://dashboard.render.com/u/settings?add-api-key" -ForegroundColor Gray
    Write-Host "   Then: Dashboard -> monm-api -> Manual Deploy -> Deploy latest commit" -ForegroundColor Gray
}

Write-Host "`nLive: https://monm-secure-messaging.netlify.app" -ForegroundColor Green
Write-Host ""
