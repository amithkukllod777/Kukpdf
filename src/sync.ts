/**
 * Cloud sync engine — reconciles the on-device IndexedDB store with the shared
 * Kuklabs backend so the same account sees its PDFs on every device.
 *
 * Model (docs are immutable once created, so content sync is existence-based):
 *  1. push local deletions (tombstones) → remote, then clear the tombstone
 *  2. apply remote state → local: remote tombstone deletes the local copy;
 *     a remote-only doc is downloaded
 *  3. push local-only docs → remote (upload once, then mark syncedAt)
 *
 * Last-write-wins by the server `updatedAt`; every row is scoped server-side to
 * the authenticated account (no client-trusted ids).
 */
import { listDocs, saveDoc, deleteDoc, listTombstones, removeTombstone } from './db';
import { isLoggedIn } from './kuklabs/authClient';
import {
  listRemoteDocs, uploadRemoteDoc, downloadRemoteDoc, deleteRemoteDoc, type RemoteDoc,
} from './kuklabs/syncClient';
import type { DocItem } from './types';

export interface SyncResult {
  skipped?: boolean;
  uploaded: number;
  downloaded: number;
  deleted: number;
}

let running = false;

/** Run one full two-way sync. No-op (skipped) when signed out or already running. */
export async function syncNow(): Promise<SyncResult> {
  if (running) return { skipped: true, uploaded: 0, downloaded: 0, deleted: 0 };
  if (!(await isLoggedIn())) return { skipped: true, uploaded: 0, downloaded: 0, deleted: 0 };
  running = true;
  let uploaded = 0, downloaded = 0, deleted = 0;
  try {
    const [localDocs, tombstones, remote] = await Promise.all([
      listDocs(), listTombstones(), listRemoteDocs(),
    ]);
    const tombSet = new Set(tombstones);
    const localById = new Map(localDocs.map((d) => [d.id, d]));
    const remoteById = new Map<string, RemoteDoc>(remote.map((r) => [r.id, r]));

    // 1. Push local deletions to the cloud.
    for (const id of tombstones) {
      try {
        await deleteRemoteDoc(id);
        await removeTombstone(id);
      } catch { /* keep the tombstone; retry next sync */ }
    }

    // 2. Apply remote → local (skip anything we just tombstoned this round).
    for (const r of remote) {
      if (tombSet.has(r.id)) continue;
      if (r.deleted) {
        if (localById.has(r.id)) { await deleteDoc(r.id); deleted++; }
        continue;
      }
      if (!localById.has(r.id)) {
        try {
          const blob = await downloadRemoteDoc(r.id);
          const doc: DocItem = {
            id: r.id, name: r.name, kind: (r.kind || 'pdf') as DocItem['kind'],
            pages: [], createdAt: r.createdAt || Date.now(), size: blob.size || r.size || 0,
            blob, updatedAt: r.updatedAt, syncedAt: Date.now(),
          };
          await saveDoc(doc);
          downloaded++;
        } catch { /* transient — next sync retries */ }
      }
    }

    // 3. Push local-only docs to the cloud (upload once; content is immutable).
    for (const d of localDocs) {
      if (d.trashed) continue;
      const r = remoteById.get(d.id);
      if (r?.deleted) continue;            // honoured as a remote delete in step 2
      if (r) {                             // already on the server — just note it
        if (!d.syncedAt) await saveDoc({ ...d, syncedAt: Date.now() });
        continue;
      }
      if (d.syncedAt) continue;            // uploaded before, remote row missing → leave it
      try {
        const { updatedAt } = await uploadRemoteDoc({
          id: d.id, name: d.name, kind: d.kind, createdAt: d.createdAt, blob: d.blob,
        });
        await saveDoc({ ...d, updatedAt, syncedAt: Date.now() });
        uploaded++;
      } catch { /* transient — next sync retries */ }
    }

    return { uploaded, downloaded, deleted };
  } finally {
    running = false;
  }
}
