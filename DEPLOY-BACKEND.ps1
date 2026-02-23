# MonM - Deploy Backend to Render (via GitHub push)
# Run: $env:GITHUB_TOKEN="ghp_xxx"; .\DEPLOY-BACKEND.ps1

$ErrorActionPreference = "Stop"
$root = "D:\monm"
$repoName = "monm"

Write-Host "`n=== MonM Backend Deploy ===" -ForegroundColor Green

$gt = $env:GITHUB_TOKEN
if (-not $gt) {
    Write-Host "`nGITHUB_TOKEN required. Create at: https://github.com/settings/tokens (repo scope)" -ForegroundColor Yellow
    Write-Host "Run: `$env:GITHUB_TOKEN=`"ghp_xxx`"; .\DEPLOY-BACKEND.ps1`n" -ForegroundColor Gray
    exit 1
}

Write-Host "`n[1/3] GitHub..." -ForegroundColor Cyan
$user = (Invoke-RestMethod -Headers @{Authorization="token $gt"} -Uri "https://api.github.com/user").login
$exists = $null
try { $exists = Invoke-RestMethod -Headers @{Authorization="token $gt"} -Uri "https://api.github.com/repos/$user/$repoName" } catch {}
if ($exists) {
    Write-Host "   Repo exists: https://github.com/$user/$repoName" -ForegroundColor Gray
} else {
    Invoke-RestMethod -Method Post -Headers @{Authorization="token $gt"; "Content-Type"="application/json"} `
        -Uri "https://api.github.com/user/repos" `
        -Body (@{name=$repoName; description="MonM secure messaging PWA"; private=$false} | ConvertTo-Json)
    Write-Host "   Repo created" -ForegroundColor Gray
}

git -C $root remote remove origin 2>$null
git -C $root remote add origin "https://${gt}@github.com/${user}/${repoName}.git"
$branch = git -C $root branch --show-current
git -C $root push -u origin $branch 2>&1
if ($LASTEXITCODE -ne 0) { Write-Host "Push failed" -ForegroundColor Red; exit 1 }
Write-Host "   Pushed to origin/$branch" -ForegroundColor Green

Write-Host "`n[2/3] Render (auto-deploy from GitHub)..." -ForegroundColor Cyan
Write-Host "   If repo is connected: Render will deploy automatically" -ForegroundColor Gray
Start-Process "https://dashboard.render.com"

Write-Host "`n[3/3] Done" -ForegroundColor Green
Write-Host "   Ensure Render env: PWA_URL, CORS_ORIGINS = https://monm-secure-messaging.netlify.app" -ForegroundColor White
Write-Host "   Ensure Netlify env: NEXT_PUBLIC_API_URL, NEXT_PUBLIC_WS_URL = your Render API URL`n" -ForegroundColor White
