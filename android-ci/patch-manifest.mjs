// Injects the kukpdf://auth deep-link intent-filter into the Capacitor-generated
// AndroidManifest.xml so the Google sign-in callback can return to the app
// (KUKLABS_IDENTITY.md §3.1; must match APP_SCHEMES["kukpdf"] on the backend).
// Run in CI after `npx cap sync android`, since android/ is regenerated per build.
import { readFileSync, writeFileSync } from 'node:fs';

const path = 'android/app/src/main/AndroidManifest.xml';
let m = readFileSync(path, 'utf8');

if (m.includes('android:scheme="kukpdf"')) {
  console.log('patch-manifest: kukpdf deep link already present');
  process.exit(0);
}

const filter = `
            <intent-filter android:label="Kuklabs sign-in">
                <action android:name="android.intent.action.VIEW" />
                <category android:name="android.intent.category.DEFAULT" />
                <category android:name="android.intent.category.BROWSABLE" />
                <data android:scheme="kukpdf" android:host="auth" />
            </intent-filter>
`;

if (!m.includes('</activity>')) {
  console.error('patch-manifest: no <activity> found — manifest layout changed, aborting');
  process.exit(1);
}
m = m.replace('</activity>', `${filter}        </activity>`);
writeFileSync(path, m);
console.log('patch-manifest: injected kukpdf://auth deep link');
