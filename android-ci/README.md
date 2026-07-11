# Signed release AAB — one-time setup

The `Build Signed Android Release` workflow (`.github/workflows/build-android-release.yml`)
builds a Play-Store-ready signed `.aab`. It needs a real signing keystore that
only you should hold — Claude cannot generate this for you, since losing it
permanently locks you out of updating the app on the Play Store once published.

## 1. Generate a keystore (once, on your own machine)

```bash
keytool -genkeypair -v -keystore kukpdf-release.keystore \
  -alias kukpdf -keyalg RSA -keysize 2048 -validity 10000
```

You'll be asked for a keystore password and a key password — pick strong,
unique values and store them in a password manager. **Back up
`kukpdf-release.keystore` somewhere safe outside git** (e.g. a password
manager's file storage, or a private cloud folder). If you lose it, you can
never publish an update to the same Play Store listing again.

## 2. Add GitHub Secrets

In the repo's Settings → Secrets and variables → Actions, add:

| Secret name                 | Value                                              |
|------------------------------|-----------------------------------------------------|
| `ANDROID_KEYSTORE_BASE64`    | `base64 -w0 kukpdf-release.keystore` output         |
| `ANDROID_KEYSTORE_PASSWORD`  | the keystore password from step 1                   |
| `ANDROID_KEY_ALIAS`          | `kukpdf` (or whatever alias you used)               |
| `ANDROID_KEY_PASSWORD`       | the key password from step 1                        |

## 3. Run the workflow

Actions tab → "Build Signed Android Release" → Run workflow. Download the
`.aab` artifact and upload it to Play Console under Production/Testing →
Create new release.

Until these secrets are added, the workflow fails fast with a clear error
instead of producing an unsigned or fake "release" build.
