/**
 * KukPDF AI-tools REST client — talks to the shared backend's /api/kukpdf/ai
 * endpoints (see kukbook-erp server/kukpdfAi.ts). Summarize PDF and Ask PDF are
 * the only tools that hit our metered LLM, so they need the signed-in Kuklabs
 * account (Bearer token) and are subject to the plan's daily quota. On-device
 * tools never come here.
 *
 * Errors carry a `status` and `upgrade` flag so the UI can show the right
 * message: 401 (sign in), 402/429 with upgrade (paywall), 429 without (limit
 * reached, resets tomorrow).
 */
import { AUTH_BASE, getToken } from './authClient';

const AI_BASE = `${AUTH_BASE}/api/kukpdf/ai`;

export class AiError extends Error {
  status: number;
  upgrade: boolean;
  constructor(message: string, status: number, upgrade = false) {
    super(message);
    this.name = 'AiError';
    this.status = status;
    this.upgrade = upgrade;
  }
}

export interface AiQuota {
  signedIn: boolean;
  plan: 'anon' | 'free' | 'premium' | 'business';
  limit: number;
  used: number;
  remaining: number;
}

async function authHeaders(): Promise<Record<string, string>> {
  const token = await getToken();
  if (!token) throw new AiError('Sign in to your Kuklabs account to use AI tools.', 401);
  return { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
}

async function readError(res: Response): Promise<AiError> {
  const body = await res.json().catch(() => null);
  const msg = body?.error || 'AI request failed. Please try again.';
  return new AiError(msg, res.status, !!body?.upgrade);
}

/** Current plan + remaining AI quota (no side effects). Returns a signed-out
 * shape if there's no token, so the UI can show the paywall without throwing. */
export async function getAiQuota(): Promise<AiQuota> {
  const token = await getToken();
  const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};
  const res = await fetch(`${AI_BASE}/quota`, { headers });
  if (!res.ok) throw await readError(res);
  return (await res.json()) as AiQuota;
}

export async function summarizePdf(text: string): Promise<string> {
  const res = await fetch(`${AI_BASE}/summarize`, {
    method: 'POST',
    headers: await authHeaders(),
    body: JSON.stringify({ text }),
  });
  if (!res.ok) throw await readError(res);
  const body = await res.json();
  return String(body?.summary || '').trim();
}

export async function askPdf(text: string, question: string): Promise<string> {
  const res = await fetch(`${AI_BASE}/ask`, {
    method: 'POST',
    headers: await authHeaders(),
    body: JSON.stringify({ text, question }),
  });
  if (!res.ok) throw await readError(res);
  const body = await res.json();
  return String(body?.answer || '').trim();
}
