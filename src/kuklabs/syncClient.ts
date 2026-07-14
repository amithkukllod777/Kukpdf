/**
 * KukPDF cloud-sync REST client — talks to the shared backend's /api/kukpdf
 * endpoints (see kukbook-erp server/kukpdfSync.ts). Native apps authenticate
 * with the same Bearer session token used for auth.* ; there is no KukPDF
 * server or DB of its own (one shared server + DB, per the Kuklabs mandate).
 */
import { AUTH_BASE, getToken } from './authClient';

const SYNC_BASE = `${AUTH_BASE}/api/kukpdf`;

export interface RemoteDoc {
  id: string;
  name: string;
  kind: 'scan' | 'pdf' | 'image';
  size: number;
  createdAt: number;
  updatedAt: number;
  deleted: boolean;
}

async function authHeaders(): Promise<Record<string, string>> {
  const token = await getToken();
  if (!token) throw new Error('Sign in to sync your documents.');
  return { Authorization: `Bearer ${token}` };
}

/** Metadata for every document (including tombstones) the account has synced. */
export async function listRemoteDocs(): Promise<RemoteDoc[]> {
  const res = await fetch(`${SYNC_BASE}/docs`, { headers: await authHeaders() });
  if (!res.ok) throw new Error('Could not load your synced documents.');
  const body = await res.json().catch(() => null);
  return (body?.docs || []) as RemoteDoc[];
}

/** Upload (or replace) a document's PDF bytes + metadata. */
export async function uploadRemoteDoc(input: {
  id: string; name: string; kind: string; createdAt: number; blob: Blob;
}): Promise<{ updatedAt: number }> {
  const params = new URLSearchParams({
    name: input.name,
    kind: input.kind === 'scan' ? 'scan' : 'pdf',
    created: String(input.createdAt || Date.now()),
  });
  const res = await fetch(`${SYNC_BASE}/docs/${encodeURIComponent(input.id)}?${params}`, {
    method: 'PUT',
    headers: { ...(await authHeaders()), 'Content-Type': 'application/pdf' },
    body: input.blob,
  });
  if (!res.ok) throw new Error('Could not upload the document.');
  return (await res.json().catch(() => ({ updatedAt: Date.now() }))) as { updatedAt: number };
}

/** Download a document's PDF bytes. */
export async function downloadRemoteDoc(id: string): Promise<Blob> {
  const res = await fetch(`${SYNC_BASE}/docs/${encodeURIComponent(id)}/blob`, { headers: await authHeaders() });
  if (!res.ok) throw new Error('Could not download the document.');
  return await res.blob();
}

/** Soft-delete (tombstone) a document so the delete reaches the other devices. */
export async function deleteRemoteDoc(id: string): Promise<void> {
  const res = await fetch(`${SYNC_BASE}/docs/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers: await authHeaders(),
  });
  if (!res.ok && res.status !== 404) throw new Error('Could not delete the document.');
}

/** Erase ALL of the account's KukPDF cloud documents (Play/GDPR "delete my data").
 * The shared Kuklabs account itself is deleted separately at the account level. */
export async function deleteAllRemoteDocs(): Promise<void> {
  const res = await fetch(`${SYNC_BASE}/docs`, { method: 'DELETE', headers: await authHeaders() });
  if (!res.ok && res.status !== 404) throw new Error('Could not delete your cloud documents.');
}
