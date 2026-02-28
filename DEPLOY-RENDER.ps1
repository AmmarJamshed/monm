# Deploy Backend to Render
# Option A: Set RENDER_DEPLOY_HOOK (from Render Dashboard -> monm-api -> Settings -> Deploy Hook)
#   $env:RENDER_DEPLOY_HOOK = "https://api.render.com/deploy/srv-xxxxx?key=yyyy"
# Option B: Set RENDER_API_KEY (from https://dashboard.render.com/u/settings?add-api-key)
#   $env:RENDER_API_KEY = "rnd_xxxx"
# Then: .\DEPLOY-RENDER.ps1

$ErrorActionPreference = "Stop"

Write-Host "`n=== Deploy Render (monm-api) ===" -ForegroundColor Green

$hook = $env:RENDER_DEPLOY_HOOK
$key = $env:RENDER_API_KEY

if ($hook) {
    Write-Host "`nTriggering via Deploy Hook..." -ForegroundColor Cyan
    try {
        Invoke-RestMethod -Uri $hook -Method Get
        Write-Host "   Deploy triggered. Wait 3-5 min." -ForegroundColor Green
    } catch {
        Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
    }
} elseif ($key) {
    Write-Host "`nTriggering via API..." -ForegroundColor Cyan
    try {
        $list = Invoke-RestMethod -Uri "https://api.render.com/v1/services?limit=50" -Headers @{Authorization="Bearer $key"; Accept="application/json"}
        $monm = $list | ForEach-Object { $_.service } | Where-Object { $_.name -match "monm" } | Select-Object -First 1
        if ($monm) {
            Invoke-RestMethod -Method Post -Uri "https://api.render.com/v1/services/$($monm.id)/deploys" -Headers @{Authorization="Bearer $key"; "Content-Type"="application/json"}
            Write-Host "   Deploy triggered. Wait 3-5 min." -ForegroundColor Green
        } else {
            Write-Host "   monm-api not found." -ForegroundColor Yellow
        }
    } catch {
        Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
    }
} else {
    Write-Host "`nSet RENDER_DEPLOY_HOOK or RENDER_API_KEY:" -ForegroundColor Yellow
    Write-Host "  Deploy Hook: Render Dashboard -> monm-api -> Settings -> Deploy Hook (Copy URL)" -ForegroundColor Gray
    Write-Host "  API Key: https://dashboard.render.com/u/settings?add-api-key" -ForegroundColor Gray
    Write-Host "`n  Then: `$env:RENDER_DEPLOY_HOOK='https://api.render.com/deploy/srv-xxx'; .\DEPLOY-RENDER.ps1" -ForegroundColor White
    Start-Process "https://dashboard.render.com"
}

Write-Host ""
