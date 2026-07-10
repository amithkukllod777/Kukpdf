import { FileText, Lock, Share2, Star, Trash2 } from 'lucide-react';
import type { DocItem } from '../types';
import { formatBytes } from '../utils';
import { sharePdf } from '../capacitor/share';

export default function FileRow({ d, onOpen, onDelete, onToggleFavorite, onToggleSecure }: {
  d: DocItem;
  onOpen: () => void;
  onDelete?: () => void;
  onToggleFavorite?: () => void;
  onToggleSecure?: () => void;
}) {
  return (
    <div className="file">
      <button className="file-open" onClick={onOpen}>
        <FileText />
        <div>
          <b>{d.name}</b>
          <p>{formatBytes(d.size)} · {new Date(d.createdAt).toLocaleDateString()}</p>
        </div>
      </button>
      {d.favorite && <Star size={16} />}
      {d.secure && <Lock size={16} />}
      <button onClick={() => sharePdf(d.blob, d.name)} title="Share"><Share2 size={16} /></button>
      {onToggleFavorite && <button onClick={onToggleFavorite} title="Favorite"><Star size={16} /></button>}
      {onToggleSecure && <button onClick={onToggleSecure} title={d.secure ? 'Remove from Secure Folder' : 'Move to Secure Folder'}><Lock size={16} /></button>}
      {onDelete && <button onClick={onDelete} title="Delete"><Trash2 size={16} /></button>}
    </div>
  );
}
