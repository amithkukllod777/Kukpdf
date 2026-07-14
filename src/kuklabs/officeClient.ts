/**
 * KukPDF PDF→Office (Word/Excel) export client. This tool runs LibreOffice on the
 * shared backend (kukbook-erp server/pdfTools.ts), so — unlike the on-device
 * tools — it uses a server API and is therefore Pro-gated and daily-limited. The
 * signed-in Kuklabs bearer token is required; free/anon users get a paywall.
 *
 * Errors mirror aiClient's shape (status + upgrade) so the UI can show the right
 * message: 401 (sign in), 402 (Pro required), 429 (daily limit), 501 (tool being
 * set up on the server).
 */
import { AUTH_BASE, getToken } from './authClient';

const PDF_BASE = `${AUTH_BASE}/api/pdf`;

export type OfficeFormat = 'docx' | 'xlsx';

export class OfficeError extends Error {
  status: number;
  upgrade: boolean;
  constructor(message: string, status: number, upgrade = false) {
    super(message);
    this.name = 'OfficeError';
    this.status = status;
    this.upgrade = upgrade;
  }
}

export interface OfficeQuota {
  signedIn: boolean;
  plan: 'anon' | 'free' | 'premium' | 'business';
  limit: number;
  used: number;
  remaining: number;
}

async function bearer(): Promise<string> {
  const token = await getToken();
  if (!token) throw new OfficeError('Sign in to your Kuklabs account to export to Word/Excel.', 401);
  return token;
}

async function errorFrom(res: Response): Promise<OfficeError> {
  const body = await res.json().catch(() => null);
  const msg = body?.error || 'Export failed. Please try again.';
  // Free/anon hitting the gate (402) — treat as an upgrade prompt.
  const upgrade = !!body?.upgrade || res.status === 402;
  return new OfficeError(msg, res.status, upgrade);
}

/** Plan + remaining office-export quota (no side effects). Signed-out shape when
 * there's no token, so the UI can show the paywall without throwing. */
export async function getOfficeQuota(): Promise<OfficeQuota> {
  const token = await getToken();
  const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};
  const res = await fetch(`${PDF_BASE}/office-quota`, { headers });
  if (!res.ok) throw await errorFrom(res);
  return (await res.json()) as OfficeQuota;
}

/** Convert a PDF's bytes to a Word or Excel file. Returns the output blob. */
export async function pdfToOffice(bytes: Uint8Array, to: OfficeFormat, name: string): Promise<Blob> {
  const token = await bearer();
  const params = new URLSearchParams({ to, name: name || 'document' });
  const res = await fetch(`${PDF_BASE}/pdf-to-office?${params}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/pdf' },
    body: bytes.slice(),
  });
  if (!res.ok) throw await errorFrom(res);
  return await res.blob();
}
