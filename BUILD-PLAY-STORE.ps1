# MonM - Build signed AAB for Play Store
# Output: releases/android/monm-release.aab
#
# First-time setup:
# 1. Create keystore (run once):
#    cd packages/monm-android/android
#    keytool -genkey -v -keystore monm-release.keystore -alias monm -keyalg RSA -keysize 2048 -validity 10000
#
# 2. Create keystore.properties:
#    Copy keystore.properties.example to keystore.properties
#    Fill in storePassword, keyPassword, keyAlias, storeFile=monm-release.keystore
#
# 3. Run this script: .\BUILD-PLAY-STORE.ps1

$ErrorActionPreference = "Stop"
$root = "D:\monm"
$releases = "$root\releases"
$androidDir = "$root\packages\monm-android"
$androidBuild = "$androidDir\android"

Write-Host "`n=== MonM Play Store Build ===" -ForegroundColor Green
Write-Host "Output: $releases\android\monm-release.aab`n" -ForegroundColor Cyan

# Check keystore
$keystorePath = "$androidBuild\monm-release.keystore"
$keystoreProps = "$androidBuild\keystore.properties"

if (-not (Test-Path $keystorePath)) {
    Write-Host "[!] Keystore not found: $keystorePath" -ForegroundColor Yellow
    Write-Host "`nCreate it with:" -ForegroundColor White
    Write-Host "  cd $androidBuild" -ForegroundColor Gray
    Write-Host '  keytool -genkey -v -keystore monm-release.keystore -alias monm -keyalg RSA -keysize 2048 -validity 10000' -ForegroundColor Gray
    Write-Host "`nThen copy keystore.properties.example to keystore.properties and fill in passwords." -ForegroundColor White
    exit 1
}

if (-not (Test-Path $keystoreProps)) {
    Write-Host "[!] keystore.properties not found" -ForegroundColor Yellow
    Write-Host "  Copy: $androidBuild\keystore.properties.example -> keystore.properties" -ForegroundColor Gray
    Write-Host "  Edit keystore.properties with your storePassword, keyPassword" -ForegroundColor Gray
    exit 1
}

# Ensure releases dir
New-Item -ItemType Directory -Force -Path "$releases\android" | Out-Null

# 1. Build frontend
Write-Host "[1/3] Building frontend..." -ForegroundColor Cyan
Set-Location "$root\frontend"
$ErrorActionPreference = "Continue"
npm run build 2>&1 | Out-Null
$ErrorActionPreference = "Stop"
if ($LASTEXITCODE -ne 0) { Write-Host "Frontend build failed" -ForegroundColor Red; exit 1 }
Write-Host "   OK" -ForegroundColor Green

# 2. Sync Capacitor
Write-Host "`n[2/3] Syncing Capacitor..." -ForegroundColor Cyan
Set-Location $androidDir
npx cap sync android 2>&1 | Out-Null
Write-Host "   OK" -ForegroundColor Green

# 3. Build release AAB
Write-Host "`n[3/3] Building signed release AAB..." -ForegroundColor Cyan
Set-Location $androidBuild
$ErrorActionPreference = "Continue"
.\gradlew.bat bundleRelease 2>&1 | Out-Null
$ErrorActionPreference = "Stop"

$aabPath = "$androidBuild\app\build\outputs\bundle\release\app-release.aab"
if (Test-Path $aabPath) {
    Copy-Item $aabPath "$releases\android\monm-release.aab" -Force
    Write-Host "   AAB: $releases\android\monm-release.aab" -ForegroundColor Green
} else {
    Write-Host "   Build failed. Check gradle output." -ForegroundColor Red
    exit 1
}

Write-Host "`n=== Done ===" -ForegroundColor Green
Write-Host "Upload to Play Console: https://play.google.com/console" -ForegroundColor White
Write-Host "  Production -> Create new release -> Upload $releases\android\monm-release.aab`n" -ForegroundColor Gray
