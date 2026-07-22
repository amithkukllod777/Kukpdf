/**
 * KukPDF account-deletion REQUEST client.
 *
 * The Kuklabs Account is shared across every Kuk app, so KukPDF can't hard-delete
 * it in-app. Instead the signed-in user files a deletion *request*; the backend
 * records it and notifies the team, who remove the account and email the user a
 * confirmation. (This is separate from "delete my data", which wipes only KukPDF
 * documents on-device and in the KukPDF cloud.)
 *
 * Auth: the signed-in Kuklabs bearer token (same as the AI / office clients).
 */
import { AUTH_BASE, getToken } from './authClient';

const ACCOUNT_BASE = `${AUTH_BASE}/api/kukpdf/account`;

export class AccountError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = 'AccountError';
    this.status = status;
  }
}

export interface DeletionStatus {
  signedIn: boolean;
  pending: boolean;
  requestedAt?: number;
}

async function errorFrom(res: Response): Promise<AccountError> {
  const body = await res.json().catch(() => null);
  return new AccountError(body?.error || 'Something went wrong. Please try again.', res.status);
}

/** Whether the signed-in account already has a pending deletion request. Signed-out
 * shape when there's no token, so the UI can render without throwing. */
export async function getDeletionStatus(): Promise<DeletionStatus> {
  const token = await getToken();
  if (!token) return { signedIn: false, pending: false };
  const res = await fetch(`${ACCOUNT_BASE}/deletion-request`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw await errorFrom(res);
  return (await res.json()) as DeletionStatus;
}

/** File an account-deletion request for the signed-in Kuklabs account. */
export async function requestAccountDeletion(reason?: string): Promise<void> {
  const token = await getToken();
  if (!token) throw new AccountError('Sign in to your Kuklabs account first.', 401);
  const res = await fetch(`${ACCOUNT_BASE}/deletion-request`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ reason: reason || '' }),
  });
  if (!res.ok) throw await errorFrom(res);
}
