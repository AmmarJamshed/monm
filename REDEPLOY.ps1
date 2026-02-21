# MonM - Redeploy Frontend (Netlify) + Backend (Render)
# Both auto-deploy when you push to GitHub. Run this to push and trigger both.

$ErrorActionPreference = "Stop"
$root = "D:\monm"

Write-Host "`n=== MonM Redeploy ===" -ForegroundColor Green

# 1. Check for uncommitted changes
Set-Location $root
$status = git status --porcelain
if ($status) {
    Write-Host "`nUncommitted changes found. Commit first:" -ForegroundColor Yellow
    git status
    Write-Host "`n  git add -A; git commit -m 'Your message'; .\REDEPLOY.ps1`n" -ForegroundColor Gray
    exit 1
}

# 2. Push to trigger Netlify + Render
Write-Host "`nPushing to GitHub..." -ForegroundColor Cyan
git push origin master
if ($LASTEXITCODE -ne 0) {
    Write-Host "Push failed. Fix and try again." -ForegroundColor Red
    exit 1
}

Write-Host "`n[OK] Pushed. Netlify and Render will auto-deploy in 1-3 minutes." -ForegroundColor Green
Write-Host "`n  Netlify:  https://app.netlify.com/sites/monm-secure-messaging/deploys" -ForegroundColor Gray
Write-Host "  Render:   https://dashboard.render.com" -ForegroundColor Gray
Write-Host "  Live URL: https://monm-secure-messaging.netlify.app`n" -ForegroundColor Gray

# 3. Optional: Trigger Netlify build via API (if token set)
$nt = $env:NETLIFY_AUTH_TOKEN
if ($nt) {
    Write-Host "Triggering Netlify build..." -ForegroundColor Cyan
    $site = "monm-secure-messaging"
    try {
        $sites = Invoke-RestMethod -Uri "https://api.netlify.com/api/v1/sites" -Headers @{Authorization="Bearer $nt"}
        $sid = ($sites | Where-Object { $_.name -eq $site }).id
        if ($sid) {
            Invoke-RestMethod -Method Post -Uri "https://api.netlify.com/api/v1/sites/$sid/builds" -Headers @{Authorization="Bearer $nt"}
            Write-Host "  Netlify build triggered." -ForegroundColor Green
        }
    } catch { Write-Host "  (Netlify trigger skipped: $_)" -ForegroundColor Gray }
}

Write-Host ""
