# MonM - Setup Java on D drive, set permanent PATH, then build APK + Desktop EXE
# Run as Administrator to set system-wide JAVA_HOME and PATH

$ErrorActionPreference = "Stop"
$javaDir = "D:\Java"
$jdkHome = "D:\Java\jdk-21"
$root = "D:\monm"

Write-Host "`n=== MonM: Java + Build Setup ===" -ForegroundColor Green

# --- 1. Download and extract JDK 21 to D drive (required for Android build) ---
if (-not (Test-Path "$jdkHome\bin\java.exe")) {
    Write-Host "`n[1/5] Downloading JDK 21 to D drive..." -ForegroundColor Cyan
    New-Item -ItemType Directory -Force -Path $javaDir | Out-Null
    $url = "https://github.com/adoptium/temurin21-binaries/releases/download/jdk-21.0.10%2B7/OpenJDK21U-jdk_x64_windows_hotspot_21.0.10_7.zip"
    $zip = "$javaDir\jdk.zip"
    if (-not (Test-Path $zip)) {
        Invoke-WebRequest -Uri $url -OutFile $zip -UseBasicParsing
    }
    if ((Get-Item $zip).Length -lt 100000000) { throw "Download incomplete or corrupted" }
    Write-Host "   Extracting..." -ForegroundColor Gray
    Expand-Archive -Path $zip -DestinationPath $javaDir -Force
    $extracted = Get-ChildItem $javaDir -Directory | Where-Object { $_.Name -match "jdk" } | Select-Object -First 1
    if ($extracted -and $extracted.Name -ne "jdk-17") {
        if (Test-Path $jdkHome) { Remove-Item $jdkHome -Recurse -Force }
        Rename-Item $extracted.FullName "jdk-17"
    }
    Remove-Item $zip -Force -ErrorAction SilentlyContinue
    Write-Host "   OK - $jdkHome" -ForegroundColor Green
} else {
    Write-Host "`n[1/5] JDK already at $jdkHome" -ForegroundColor Green
}

# --- 2. Set JAVA_HOME and PATH permanently (Machine level) ---
Write-Host "`n[2/5] Setting JAVA_HOME and PATH permanently..." -ForegroundColor Cyan
[Environment]::SetEnvironmentVariable("JAVA_HOME", $jdkHome, "User")
$currentPath = [Environment]::GetEnvironmentVariable("Path", "User")
$javaBin = "$jdkHome\bin"
if ($currentPath -notlike "*$javaBin*") {
    [Environment]::SetEnvironmentVariable("Path", "$currentPath;$javaBin", "User")
    Write-Host "   Added $javaBin to PATH" -ForegroundColor Gray
}
$env:JAVA_HOME = $jdkHome
$env:Path = "$jdkHome\bin;" + $env:Path
Write-Host "   OK - JAVA_HOME=$jdkHome (permanent for user)" -ForegroundColor Green

# Verify Java
& "$jdkHome\bin\java.exe" -version

# --- 3. Download Android SDK (if needed) ---
$androidSdk = "D:\monm\android-sdk"
if (-not (Test-Path "$androidSdk\cmdline-tools\latest\bin\sdkmanager.bat")) {
    Write-Host "`n[3/5] Downloading Android SDK command-line tools..." -ForegroundColor Cyan
    New-Item -ItemType Directory -Force -Path $androidSdk | Out-Null
    $sdkUrl = "https://dl.google.com/android/repository/commandlinetools-win-11076708_latest.zip"
    $sdkZip = "$androidSdk\cmdline-tools.zip"
    Invoke-WebRequest -Uri $sdkUrl -OutFile $sdkZip -UseBasicParsing
    Expand-Archive -Path $sdkZip -DestinationPath "$androidSdk\tmp" -Force
    New-Item -ItemType Directory -Force -Path "$androidSdk\cmdline-tools\latest" | Out-Null
    Move-Item "$androidSdk\tmp\cmdline-tools\*" "$androidSdk\cmdline-tools\latest\" -Force
    Remove-Item "$androidSdk\tmp" -Recurse -Force -ErrorAction SilentlyContinue
    Remove-Item $sdkZip -Force -ErrorAction SilentlyContinue
    Write-Host "   Accepting licenses..." -ForegroundColor Gray
    New-Item -ItemType Directory -Force -Path "$androidSdk\licenses" | Out-Null
    "`n8933bad161af4178b1185d1a37fbf41ea5269c55" | Out-File "$androidSdk\licenses\android-sdk-license" -Encoding ASCII
    "`n84831b9409646a918e30573bab4c9c91346d8abd" | Out-File "$androidSdk\licenses\android-sdk-preview-license" -Encoding ASCII
    Write-Host "   Installing platform-tools, build-tools, platform..." -ForegroundColor Gray
    $env:ANDROID_HOME = $androidSdk
    & "$androidSdk\cmdline-tools\latest\bin\sdkmanager.bat" --sdk_root=$androidSdk "platform-tools" "build-tools;33.0.2" "build-tools;34.0.0" "platforms;android-35"
    Write-Host "   OK" -ForegroundColor Green
} else {
    Write-Host "`n[3/5] Android SDK at $androidSdk" -ForegroundColor Green
    if (-not (Test-Path "$androidSdk\build-tools\34.0.0")) {
        & "$androidSdk\cmdline-tools\latest\bin\sdkmanager.bat" --sdk_root=$androidSdk "build-tools;34.0.0"
    }
}
$env:ANDROID_HOME = $androidSdk
[Environment]::SetEnvironmentVariable("ANDROID_HOME", $androidSdk, "User")

# --- 4. Build Android APK ---
Write-Host "`n[4/5] Building Android APK..." -ForegroundColor Cyan
Set-Location "$root\packages\monm-android"
npx cap sync android
# Point Gradle to Android SDK
$localProps = "$root\packages\monm-android\android\local.properties"
"sdk.dir=$($androidSdk -replace '\\','/')" | Set-Content $localProps -Encoding ASCII
Set-Location "$root\packages\monm-android\android"
New-Item -ItemType Directory -Force -Path "$root\releases\android" | Out-Null
.\gradlew.bat assembleDebug
if (Test-Path "app\build\outputs\apk\debug\app-debug.apk") {
    Copy-Item "app\build\outputs\apk\debug\app-debug.apk" "$root\releases\android\monm-debug.apk" -Force
    Write-Host "   APK: $root\releases\android\monm-debug.apk" -ForegroundColor Green
}

# --- 5. Build Desktop EXE ---
Write-Host "`n[5/5] Building Desktop EXE..." -ForegroundColor Cyan
Set-Location "$root\packages\monm-desktop"
npm run build 2>&1 | Out-Null
if (Test-Path "$root\releases\desktop") {
    Get-ChildItem "$root\releases\desktop" -Filter "*.exe" -ErrorAction SilentlyContinue | ForEach-Object {
        Write-Host "   EXE: $($_.FullName)" -ForegroundColor Green
    }
}

Write-Host "`n=== Done ===" -ForegroundColor Green
Write-Host "JAVA_HOME is permanently set to $jdkHome" -ForegroundColor White
Write-Host "Restart terminal (or new session) for PATH to take effect." -ForegroundColor Yellow
Write-Host ""
