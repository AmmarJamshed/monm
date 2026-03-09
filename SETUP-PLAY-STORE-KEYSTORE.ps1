# MonM - Create signing keystore for Play Store (run once)
# SAVE YOUR PASSWORDS - you need them for keystore.properties and future app updates.
#
# Option A (interactive): .\SETUP-PLAY-STORE-KEYSTORE.ps1
# Option B (env vars):   $env:KEYSTORE_PASS="mypass"; $env:KEY_PASS="mypass"; .\SETUP-PLAY-STORE-KEYSTORE.ps1

$ErrorActionPreference = "Stop"
$androidBuild = "D:\monm\packages\monm-android\android"

Write-Host "`n=== MonM Play Store Keystore Setup ===" -ForegroundColor Green

Set-Location $androidBuild

if (Test-Path "monm-release.keystore") {
    Write-Host "[!] monm-release.keystore already exists." -ForegroundColor Yellow
    $overwrite = Read-Host "Overwrite? (y/N)"
    if ($overwrite -ne "y") { exit 0 }
    Remove-Item "monm-release.keystore" -Force
}

$storePass = $env:KEYSTORE_PASS
$keyPass = $env:KEY_PASS

if ($storePass -and $keyPass) {
    Write-Host "Creating keystore (using env vars)..." -ForegroundColor Cyan
    keytool -genkey -v -keystore monm-release.keystore -alias monm -keyalg RSA -keysize 2048 -validity 10000 `
        -storepass $storePass -keypass $keyPass `
        -dname "CN=MonM, OU=App, O=MonM, L=City, S=State, C=US"
} else {
    Write-Host "You will be prompted for keystore password, key password, and identity." -ForegroundColor Cyan
    keytool -genkey -v -keystore monm-release.keystore -alias monm -keyalg RSA -keysize 2048 -validity 10000
}

if ($LASTEXITCODE -ne 0) {
    Write-Host "`nKeystore creation failed." -ForegroundColor Red
    exit 1
}

Write-Host "`n[OK] Keystore created: $androidBuild\monm-release.keystore" -ForegroundColor Green

# Create keystore.properties if it doesn't exist
if (-not (Test-Path "keystore.properties")) {
    $kp = @"
storePassword=$storePass
keyPassword=$keyPass
keyAlias=monm
storeFile=monm-release.keystore
"@
    if ($storePass -and $keyPass) {
        $kp | Out-File -FilePath "keystore.properties" -Encoding utf8
        Write-Host "[OK] keystore.properties created" -ForegroundColor Green
    } else {
        Write-Host "`nCreate keystore.properties with your passwords:" -ForegroundColor White
        Write-Host "  Copy keystore.properties.example to keystore.properties" -ForegroundColor Gray
        Write-Host "  Set storePassword and keyPassword" -ForegroundColor Gray
    }
}

Write-Host "`nNext: Run .\BUILD-PLAY-STORE.ps1 to build the signed AAB`n" -ForegroundColor White
