import { Capacitor } from '@capacitor/core';
import { AUTH_BASE, getToken } from '../kuklabs/authClient';

/**
 * Native push notifications (FCM on Android, APNs-via-FCM on iOS) through
 * @capacitor-firebase/messaging + the shared Firebase project. The device's FCM
 * token is registered with the shared Kuklabs backend against the signed-in user
 * (`POST /api/push/register`, Bearer-authed) so a future server event can reach
 * this device. iOS is the current target; on a platform where Firebase isn't
 * configured (e.g. Android without google-services.json) this no-ops safely.
 *
 * The `app` scope ("kukpdf") keeps our tokens in the product-agnostic
 * kuklabs_push_tokens registry, isolated from other Kuklabs apps' push.
 */
const APP_KEY = 'kukpdf';
let listenerAdded = false;

async function postToken(token: string): Promise<void> {
  const bearer = await getToken();
  if (!bearer || !token) return;
  try {
    await fetch(`${AUTH_BASE}/api/push/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${bearer}` },
      body: JSON.stringify({ token, platform: Capacitor.getPlatform(), app: APP_KEY }),
    });
  } catch { /* best-effort — push is never allowed to block the app */ }
}

/**
 * Ask for notification permission, fetch the FCM token and register it for the
 * signed-in user. Native-only and safe to call repeatedly (the backend upserts
 * by token). Called whenever the app becomes signed-in.
 */
export async function registerForPush(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;
  try {
    const { FirebaseMessaging } = await import('@capacitor-firebase/messaging');
    const perm = await FirebaseMessaging.requestPermissions();
    if (perm.receive !== 'granted') return;
    if (!listenerAdded) {
      listenerAdded = true;
      // FCM rotates tokens; re-register whenever a fresh one is issued.
      FirebaseMessaging.addListener('tokenReceived', (e: { token?: string }) => {
        if (e?.token) postToken(e.token);
      }).catch(() => {});
    }
    const { token } = await FirebaseMessaging.getToken();
    if (token) await postToken(token);
  } catch (e) {
    // Firebase not configured on this platform — push is optional.
    console.warn('[push] registration skipped', e);
  }
}

/** Remove this device's token on sign-out (server row + local FCM token). */
export async function unregisterForPush(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;
  try {
    const { FirebaseMessaging } = await import('@capacitor-firebase/messaging');
    let token = '';
    try { token = (await FirebaseMessaging.getToken())?.token || ''; } catch { /* no token yet */ }
    if (token) {
      try {
        await fetch(`${AUTH_BASE}/api/push/unregister`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        });
      } catch { /* best-effort */ }
    }
    await FirebaseMessaging.deleteToken().catch(() => {});
  } catch { /* optional */ }
}
