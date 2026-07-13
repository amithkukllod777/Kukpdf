/**
 * Smart Mobile-number-or-Email detection — KUKLABS_UI_AUTH_AGENT_PACK_V2.
 * The single identity field auto-detects mode; phone numbers submit in E.164.
 * (Full compact country-selector chip is not built yet — India default +91;
 * bare 10-digit Indian and full E.164 are both accepted, matching the backend.)
 */
export type IdentityMode = 'email' | 'phone' | 'unknown';

export function detectIdentity(value: string): IdentityMode {
  const v = value.trim();
  if (!v) return 'unknown';
  if (v.includes('@')) return isEmail(v) ? 'email' : 'unknown';
  if (/[0-9]/.test(v) && /^[+\d][\d\s\-()]*$/.test(v)) return isPhone(v) ? 'phone' : 'unknown';
  return 'unknown';
}

export function isEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

/** Accepts full E.164 (+CC…) or a bare 10-digit Indian mobile. */
export function isPhone(value: string): boolean {
  const d = value.replace(/[\s\-()]/g, '');
  return /^\+[1-9]\d{9,14}$/.test(d) || /^[6-9]\d{9}$/.test(d) || /^[1-9]\d{10,14}$/.test(d);
}

/** Normalises a phone to E.164 (default country India / +91). */
export function toE164(value: string, defaultCc = '91'): string {
  const d = value.replace(/[\s\-()]/g, '');
  if (d.startsWith('+')) return d;
  if (/^[6-9]\d{9}$/.test(d)) return `+${defaultCc}${d}`;
  if (/^\d{11,15}$/.test(d)) return `+${d}`;
  return d;
}

export function isValidIdentity(value: string): boolean {
  return isEmail(value) || isPhone(value);
}
