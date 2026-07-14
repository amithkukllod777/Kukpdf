import { useEffect, useState } from 'react';
import { CheckCircle2, Info, X, XCircle } from 'lucide-react';
import { subscribeToasts, type ToastItem } from '../toast';

/** Renders active toasts bottom-centre (above the nav). Auto-dismisses; an
 *  optional action button (e.g. Undo) stays until tapped or the timer ends. */
export default function Toaster() {
  const [items, setItems] = useState<ToastItem[]>([]);

  useEffect(() => subscribeToasts((t) => {
    setItems((cur) => [...cur, t]);
    setTimeout(() => setItems((cur) => cur.filter((x) => x.id !== t.id)), t.duration);
  }), []);

  const dismiss = (id: string) => setItems((cur) => cur.filter((x) => x.id !== id));

  if (!items.length) return null;
  return (
    <div className="toaster" role="status" aria-live="polite">
      {items.map((t) => (
        <div key={t.id} className={`toast ${t.type}`}>
          <span className="toast-ico">
            {t.type === 'success' ? <CheckCircle2 size={18} /> : t.type === 'error' ? <XCircle size={18} /> : <Info size={18} />}
          </span>
          <span className="toast-msg">{t.message}</span>
          {t.action && (
            <button className="toast-action" onClick={() => { t.action!.onClick(); dismiss(t.id); }}>{t.action.label}</button>
          )}
          <button className="toast-x" aria-label="Dismiss" onClick={() => dismiss(t.id)}><X size={16} /></button>
        </div>
      ))}
    </div>
  );
}
