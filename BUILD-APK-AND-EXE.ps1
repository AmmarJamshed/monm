# MonM - Build APK and Desktop EXE
# Output: D:\monm\releases\
#   - releases\android\monm-debug.apk
#   - releases\desktop\MonM Setup x.x.x.exe, MonM x.x.x.exe (portable)

$ErrorActionPreference = "Stop"
$root = "D:\monm"
$releases = "D:\monm\releases"

Write-Host "`n=== MonM Native Builds ===" -ForegroundColor Green
Write-Host "Output: $releases`n" -ForegroundColor Cyan

# Ensure releases dir exists
New-Item -ItemType Directory -Force -Path $releases | Out-Null
New-Item -ItemType Directory -Force -Path "$releases\android" | Out-Null

# --- 1. Deploy frontend first (so PWA has NativePrivacyScreen) ---
Write-Host "[1/4] Deploying frontend (Capacitor deps)..." -ForegroundColor Cyan
Set-Location "$root\frontend"
npm run build 2>&1 | Out-Null
if ($LASTEXITCODE -ne 0) { Write-Host "Frontend build failed" -ForegroundColor Red; exit 1 }
Write-Host "   OK" -ForegroundColor Green

# --- 2. Android APK ---
Write-Host "`n[2/4] Building Android APK..." -ForegroundColor Cyan
Set-Location "$root\packages\monm-android"
if (-not (Test-Path "node_modules")) { npm install }
npx cap add android 2>$null
npx cap sync android
# Build APK (requires Android SDK - run from Android Studio if this fails)
if (Test-Path "android\gradlew.bat") {
    Push-Location android
    .\gradlew.bat assembleDebug 2>&1 | Out-Null
    Pop-Location
}
if (Test-Path "android\app\build\outputs\apk\debug\app-debug.apk") {
    Copy-Item "android\app\build\outputs\apk\debug\app-debug.apk" "$releases\android\monm-debug.apk" -Force
    Write-Host "   APK: $releases\android\monm-debug.apk" -ForegroundColor Green
} else {
    Write-Host "   Run: cd packages\monm-android; npx cap open android" -ForegroundColor Yellow
    Write-Host "   Then in Android Studio: Build > Build Bundle(s) / APK(s) > Build APK(s)" -ForegroundColor Yellow
    Write-Host "   APK will be in android\app\build\outputs\apk\debug\" -ForegroundColor Gray
}

# --- 3. Desktop EXE ---
Write-Host "`n[3/4] Building Desktop EXE..." -ForegroundColor Cyan
Set-Location "$root\packages\monm-desktop"
if (-not (Test-Path "node_modules")) { npm install }
npm run build 2>&1
if (Test-Path "$releases\desktop") {
    Get-ChildItem "$releases\desktop" -Filter "*.exe" | ForEach-Object {
        Write-Host "   EXE: $($_.FullName)" -ForegroundColor Green
    }
}

# --- 4. Summary ---
Write-Host "`n[4/4] Done!" -ForegroundColor Cyan
Write-Host "`nAndroid: Install Android Studio, then:" -ForegroundColor White
Write-Host "  cd packages\monm-android" -ForegroundColor Gray
Write-Host "  npx cap open android" -ForegroundColor Gray
Write-Host "  Build > Build Bundle(s) / APK(s) > Build APK(s)" -ForegroundColor Gray
Write-Host "`nDesktop: EXE in $releases\desktop\" -ForegroundColor White
Write-Host ""
