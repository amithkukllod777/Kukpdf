/**
 * Standard friendly auth messages — KUKLABS_UI_AUTH_AGENT_PACK_V2
 * (KUKLABS_AUTH_CONTENT_TEMPLATES.json → messages). Raw server errors must
 * never reach the UI; wrong email/phone/password uses ONE safe generic message.
 */
export const authMessages = {
  genericSignInError: "We couldn't sign you in. Check your email or mobile number and password, then try again.",
  invalidEmail: 'Enter a valid email address.',
  invalidPhone: 'Enter a valid mobile number for the selected country.',
  emptyIdentity: 'Enter your email address or mobile number.',
  emptyPassword: 'Enter your password.',
  weakPassword: 'Use at least 8 characters with at least one letter and one number.',
  emptyName: 'Enter your full name.',
  otpInvalid: "That verification code isn't correct. Check it and try again.",
  otpExpired: 'That verification code has expired. Request a new code.',
  offline: "You're offline. Check your internet connection and try again.",
  serverError: 'Something went wrong on our side. Please try again in a moment.',
  genericFallback: "We couldn't complete that action. Please try again.",
} as const;

/**
 * Maps a raw thrown error to a safe, friendly message. Network failures →
 * offline; anything from the auth service that isn't a clean known case →
 * genericFallback, so no raw JSON/stack ever surfaces.
 */
export function friendlyError(e: unknown, fallback: string = authMessages.genericFallback): string {
  const raw = (e instanceof Error ? e.message : String(e ?? '')).toLowerCase();
  if (!raw) return fallback;
  if (raw.includes('offline') || raw.includes('connection') || raw.includes("can't reach") || raw.includes('network') || raw.includes('failed to fetch')) {
    return authMessages.offline;
  }
  if (raw.includes('expired')) return authMessages.otpExpired;
  if (raw.includes('code') && (raw.includes('invalid') || raw.includes("isn't") || raw.includes('incorrect'))) return authMessages.otpInvalid;
  // Invalid credentials / not found / unauthorized → one safe generic message.
  if (raw.includes('invalid') || raw.includes('password') || raw.includes('not found') || raw.includes('unauthorized') || raw.includes('no ')) {
    return authMessages.genericSignInError;
  }
  if (raw.includes('500') || raw.includes('server') || raw.includes('database') || raw.includes('unavailable')) {
    return authMessages.serverError;
  }
  return fallback;
}
