import { get, set, del, keys } from 'idb-keyval';
import type { DocItem, SignatureItem } from './types';

const DOC_PREFIX = 'kukpdf:doc:';
const SIG_PREFIX = 'kukpdf:sig:';
const TOMB_PREFIX = 'kukpdf:tomb:';

export async function listDocs(): Promise<DocItem[]> {
  const all = await keys();
  const docKeys = all.filter((k): k is string => typeof k === 'string' && k.startsWith(DOC_PREFIX));
  const docs = await Promise.all(docKeys.map((k) => get<DocItem>(k)));
  return docs
    .filter((d): d is DocItem => !!d)
    .sort((a, b) => b.createdAt - a.createdAt);
}

export async function saveDoc(doc: DocItem): Promise<void> {
  await set(DOC_PREFIX + doc.id, doc);
}

export async function deleteDoc(id: string): Promise<void> {
  await del(DOC_PREFIX + id);
}

/** Record a deletion so cloud sync can propagate it to the user's other devices.
 * Cleared by the sync engine once the remote delete has been acknowledged. */
export async function addTombstone(id: string): Promise<void> {
  await set(TOMB_PREFIX + id, Date.now());
}

export async function listTombstones(): Promise<string[]> {
  const all = await keys();
  return all
    .filter((k): k is string => typeof k === 'string' && k.startsWith(TOMB_PREFIX))
    .map((k) => k.slice(TOMB_PREFIX.length));
}

export async function removeTombstone(id: string): Promise<void> {
  await del(TOMB_PREFIX + id);
}

export async function listSignatures(): Promise<SignatureItem[]> {
  const all = await keys();
  const sigKeys = all.filter((k): k is string => typeof k === 'string' && k.startsWith(SIG_PREFIX));
  const sigs = await Promise.all(sigKeys.map((k) => get<SignatureItem>(k)));
  return sigs.filter((s): s is SignatureItem => !!s).sort((a, b) => b.createdAt - a.createdAt);
}

export async function saveSignature(sig: SignatureItem): Promise<void> {
  await set(SIG_PREFIX + sig.id, sig);
}

export async function deleteSignature(id: string): Promise<void> {
  await del(SIG_PREFIX + id);
}
