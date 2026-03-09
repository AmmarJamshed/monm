# MonM – Play Store Upload Guide

## 1. Create signing keystore (one-time)

```powershell
cd D:\monm
.\SETUP-PLAY-STORE-KEYSTORE.ps1
```

- When prompted, enter a strong keystore password and key password.
- Store these passwords securely; you need them for future updates.
- If you prefer non-interactive mode:
  ```powershell
  $env:KEYSTORE_PASS = "YourSecurePassword"
  $env:KEY_PASS = "YourSecurePassword"
  .\SETUP-PLAY-STORE-KEYSTORE.ps1
  ```

## 2. Configure keystore.properties (if not auto-created)

If `keystore.properties` was not created:

1. Copy `packages/monm-android/android/keystore.properties.example` to `packages/monm-android/android/keystore.properties`
2. Set `storePassword` and `keyPassword` to the passwords you used for the keystore

## 3. Build the signed AAB

```powershell
.\BUILD-PLAY-STORE.ps1
```

Output: `releases/android/monm-release.aab`

## 4. Upload to Play Console

1. Open [Google Play Console](https://play.google.com/console)
2. Create or select your app
3. Go to **Production** (or **Testing** → Internal/Closed)
4. **Create new release**
5. Upload `releases/android/monm-release.aab`
6. Add release notes and submit for review

## Notes

- **Keystore backup**: Keep `monm-release.keystore` and its passwords in a safe place. If you lose them, you cannot update the app on Play Store.
- **Version**: Update `versionCode` and `versionName` in `packages/monm-android/android/app/build.gradle` for each new release.
- **App signing**: Play Store can manage app signing for you (recommended). You can upload the AAB and let Google sign it, or use your own keystore as above.
