# MonM - Complete Project (Wire Netlify to Render)
# Run: .\COMPLETE-PROJECT.ps1
# Or with Render URL: $env:RENDER_API_URL="https://monm-api-xxx.onrender.com"; .\COMPLETE-PROJECT.ps1

$ErrorActionPreference = "Stop"
$siteId = "1cc91cab-8d36-4550-9daf-01e9390d70b5"
$netlifyToken = $env:NETLIFY_AUTH_TOKEN

# Get Render API URL
$apiUrl = $env:RENDER_API_URL
if (-not $apiUrl) {
    $renderKey = $env:RENDER_API_KEY
    if ($renderKey) {
        Write-Host "`nFetching Render services..." -ForegroundColor Cyan
        $svc = Invoke-RestMethod -Uri "https://api.render.com/v1/services?limit=20" `
            -Headers @{Authorization="Bearer $renderKey"; Accept="application/json"}
        $monm = $svc | Where-Object { $_.service.name -match "monm" } | Select-Object -First 1
        if ($monm) {
            $apiUrl = "https://$($monm.service.serviceDetails.url)"
            Write-Host "   Found: $apiUrl" -ForegroundColor Green
        }
    }
}
if (-not $apiUrl) {
    Write-Host "`nRENDER_API_URL required. Get it from: https://dashboard.render.com" -ForegroundColor Yellow
    Write-Host "   After deploying monm-api, copy the service URL." -ForegroundColor Gray
    Write-Host "   Run: `$env:RENDER_API_URL=`"https://monm-api-xxx.onrender.com`"; `$env:NETLIFY_AUTH_TOKEN=`"nfp_xxx`"; .\COMPLETE-PROJECT.ps1`n" -ForegroundColor Gray
    exit 1
}

$apiUrl = $apiUrl.TrimEnd("/")
$wsUrl = $apiUrl -replace "^https", "wss"

if (-not $netlifyToken) {
    Write-Host "`nNETLIFY_AUTH_TOKEN required. Create at: https://app.netlify.com/user/applications#personal-access-tokens" -ForegroundColor Yellow
    Write-Host "   Run: `$env:NETLIFY_AUTH_TOKEN=`"nfp_xxx`"; .\COMPLETE-PROJECT.ps1`n" -ForegroundColor Gray
    exit 1
}

Write-Host "`n=== Wiring Netlify to Render ===" -ForegroundColor Green
Write-Host "   API:  $apiUrl" -ForegroundColor Gray
Write-Host "   WS:   $wsUrl" -ForegroundColor Gray

# Set Netlify env vars (set or update each)
$headers = @{Authorization="Bearer $netlifyToken"; "Content-Type"="application/json"}
$vars = @(
    @{key="NEXT_PUBLIC_API_URL"; value=$apiUrl},
    @{key="NEXT_PUBLIC_WS_URL"; value=$wsUrl}
)
foreach ($v in $vars) {
    try {
        $body = @{key=$v.key; value=$v.value; scopes=@("all")} | ConvertTo-Json
        Invoke-RestMethod -Uri "https://api.netlify.com/api/v1/sites/$siteId/env" -Method Post -Headers $headers -Body $body | Out-Null
    } catch { }
}
Write-Host "`n[1/2] Env vars set" -ForegroundColor Green

# Trigger deploy (build)
try {
    $deploy = Invoke-RestMethod -Uri "https://api.netlify.com/api/v1/sites/$siteId/builds" -Method Post -Headers $headers
    Write-Host "[2/2] Deploy triggered" -ForegroundColor Green
} catch {
    Write-Host "[2/2] Deploy: $($_.Exception.Message)" -ForegroundColor Yellow
}

Write-Host "`nDone. Frontend: https://monm-secure-messaging.netlify.app" -ForegroundColor Green
Write-Host "   Build may take 2-3 min.`n" -ForegroundColor Gray
