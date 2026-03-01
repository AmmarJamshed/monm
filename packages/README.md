# MonM Native Packages

PWA wrappers for Android (APK) and Windows (EXE) — both load the live PWA at https://monm-secure-messaging.netlify.app.

## Android APK (Screenshot Prevention)

- **Capacitor** + **@capacitor/privacy-screen** — enables `FLAG_SECURE` on Android
- Screenshots are **blocked** when using the APK (native permission)
- Requires **Android Studio** and Android SDK to build

### Build APK (no Android Studio needed)

**One-command setup + build:**
```powershell
cd D:\monm
.\SETUP-JAVA-AND-BUILD.ps1
```

**Or manual build** (after Java + Android SDK are set up):
```powershell
$env:JAVA_HOME = "D:\Java\jdk-21"
$env:ANDROID_HOME = "D:\monm\android-sdk"
cd D:\monm\packages\monm-android\android
.\gradlew.bat assembleDebug
```

Output: `D:\monm\releases\android\monm-debug.apk`

### Release APK (signed)

1. Create keystore: `keytool -genkey -v -keystore monm-release.keystore -alias monm -keyalg RSA -keysize 2048 -validity 10000`
2. Add to `android/app/build.gradle` signing config
3. Build: `./gradlew assembleRelease`

---

## Desktop EXE (Windows)

- **Electron** wrapper — loads the PWA in a standalone window
- No native screenshot prevention (Windows has no equivalent to FLAG_SECURE for apps)
- Builds to **D:\monm\releases\desktop**

### Build EXE

```powershell
cd D:\monm\packages\monm-desktop
npm install
npm run build
```

Output: `D:\monm\releases\desktop\MonM Setup x.x.x.exe` (installer) and `MonM x.x.x.exe` (portable)

---

## One-Command Build

From repo root:

```powershell
.\BUILD-APK-AND-EXE.ps1
```

Requires: Node.js, Android Studio (for APK), npm.
