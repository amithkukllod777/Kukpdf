import { Preferences } from '@capacitor/preferences';

/**
 * Kuklabs AuthKit client — the ONE login pathway (KUKLABS_IDENTITY.md §3).
 *
 * KukPDF never has its own users table, password logic or session system. This
 * is a thin client over the shared Kuklabs backend's `auth.*` tRPC procedures.
 * Native (Capacitor) apps can't rely on the `.kuklabs.com` cookie, so we use the
 * bearer token every `auth.*` mutation returns for exactly this purpose, and send
 * it back as `Authorization: Bearer` on authed calls (same pattern as KukChat/
 * KukKeep mobile).
 *
 * Base URL is the shared backend. Swap to `https://auth.kuklabs.com` once that
 * dedicated host is live; today the verified auth surface is on the main app.
 */
const AUTH_BASE = 'https://www.kuklabs.com';
const TOKEN_KEY = 'kuklabs:session-token';
const USER_KEY = 'kuklabs:user';

export interface KuklabsUser {
  id: number | string;
  name?: string | null;
  email: string;
}

/** superjson (the backend transformer) wraps inputs/outputs as `{ json: ... }`. */
async function callAuth<T>(procedure: string, input: unknown, authed = false): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (authed) {
    const token = await getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }
  let res: Response;
  try {
    res = await fetch(`${AUTH_BASE}/api/trpc/auth.${procedure}`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ json: input }),
    });
  } catch {
    throw new Error("Can't reach the Kuklabs account service. Check your connection and try again.");
  }
  const body = await res.json().catch(() => null);
  if (!res.ok || body?.error) {
    const msg = body?.error?.json?.message || body?.error?.message || 'Something went wrong. Please try again.';
    throw new Error(msg);
  }
  return body?.result?.data?.json as T;
}

type AuthResult = { success?: boolean; mfaRequired?: boolean; token?: string; user?: KuklabsUser };

async function persistSession(r: AuthResult) {
  if (r?.token) await Preferences.set({ key: TOKEN_KEY, value: r.token });
  if (r?.user) await Preferences.set({ key: USER_KEY, value: JSON.stringify(r.user) });
}

/** Email + password sign-in. Returns { mfaRequired } — if true, call verifyLoginOtp. */
export async function directLogin(email: string, password: string): Promise<{ mfaRequired: boolean }> {
  const r = await callAuth<AuthResult>('directLogin', { email, password });
  await persistSession(r);
  return { mfaRequired: !!r?.mfaRequired };
}

export async function verifyLoginOtp(email: string, otp: string): Promise<void> {
  await persistSession(await callAuth<AuthResult>('verifyLoginOtp', { email, otp }));
}

/** Signup — sends an email OTP; account is created after verifyOtp. */
export async function directRegister(input: { name: string; email: string; phone: string; password: string }): Promise<void> {
  await callAuth('directRegister', { ...input, acceptedTerms: true });
}

export async function verifyOtp(email: string, otp: string): Promise<void> {
  await persistSession(await callAuth<AuthResult>('verifyOtp', { email, otp }));
}

export async function resendOtp(email: string): Promise<void> {
  await callAuth('resendOtp', { email });
}

export async function forgotPassword(email: string): Promise<void> {
  await callAuth('forgotPassword', { email });
}

export async function resetPassword(email: string, otp: string, newPassword: string): Promise<void> {
  await callAuth('resetPassword', { email, otp, newPassword });
}

/** Custom URL scheme the OAuth callback deep-links back to (must match the
 *  backend's APP_SCHEMES["kukpdf"] and the AndroidManifest intent-filter). */
export const GOOGLE_DEEPLINK_SCHEME = 'kukpdf';

/**
 * "Continue with Google" — opens the shared Kuklabs Google OAuth start URL in the
 * system browser (webview Google login is blocked by Google). Passing `app=kukpdf`
 * marks the native flow: the backend callback hands a one-time code back via the
 * `kukpdf://auth` deep link, which the app trades for a bearer token (exchangeGoogleCode).
 */
export function googleSignInUrl(returnTo = '/'): string {
  const p = new URLSearchParams({ app: GOOGLE_DEEPLINK_SCHEME, returnTo });
  return `${AUTH_BASE}/api/auth/google/start?${p.toString()}`;
}

/** Trades the one-time deep-link code for a bearer session token (native step 3). */
export async function exchangeGoogleCode(code: string): Promise<void> {
  let res: Response;
  try {
    res = await fetch(`${AUTH_BASE}/api/auth/google/app-exchange?code=${encodeURIComponent(code)}`);
  } catch {
    throw new Error("Can't reach the Kuklabs account service. Check your connection and try again.");
  }
  const body = await res.json().catch(() => null);
  if (!res.ok || !body?.token) throw new Error(body?.error || 'Google sign-in link expired — please try again.');
  await Preferences.set({ key: TOKEN_KEY, value: body.token });
  await Preferences.set({ key: USER_KEY, value: JSON.stringify({ id: body.id ?? body.email, name: body.name, email: body.email }) });
}

export async function getToken(): Promise<string | null> {
  return (await Preferences.get({ key: TOKEN_KEY })).value;
}

export async function getCurrentUser(): Promise<KuklabsUser | null> {
  const { value } = await Preferences.get({ key: USER_KEY });
  if (!value) return null;
  try { return JSON.parse(value) as KuklabsUser; } catch { return null; }
}

export async function isLoggedIn(): Promise<boolean> {
  return !!(await getToken());
}

export async function signOut(): Promise<void> {
  await Preferences.remove({ key: TOKEN_KEY });
  await Preferences.remove({ key: USER_KEY });
}
