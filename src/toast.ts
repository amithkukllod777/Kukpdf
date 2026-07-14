/**
 * Minimal toast bus — no dependency. `toast(msg)` for success/info,
 * `toast(msg, { type:'error' })`, or an actionable toast with an Undo button:
 *   toast('Deleted', { type:'info', action:{ label:'Undo', onClick } })
 * A single <Toaster/> (mounted in App) subscribes and renders them.
 */
export type ToastType = 'success' | 'error' | 'info';
export interface ToastAction { label: string; onClick: () => void; }
export interface ToastItem {
  id: string;
  message: string;
  type: ToastType;
  action?: ToastAction;
  duration: number;
}

type Listener = (t: ToastItem) => void;
const listeners = new Set<Listener>();

export function toast(message: string, opts: { type?: ToastType; action?: ToastAction; duration?: number } = {}): void {
  const item: ToastItem = {
    id: (globalThis.crypto?.randomUUID?.() ?? String(Math.round(performance.now()) + '-' + message.length)),
    message,
    type: opts.type ?? 'success',
    action: opts.action,
    duration: opts.duration ?? (opts.action ? 6000 : 3200),
  };
  listeners.forEach((l) => l(item));
}

export function subscribeToasts(l: Listener): () => void {
  listeners.add(l);
  return () => { listeners.delete(l); };
}
