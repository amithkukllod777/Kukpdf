import {
  ArrowUpDown, Combine, Droplets, FileImage, FileText, Hash, ImagePlus, KeyRound, Lock,
  MessageSquareText, Minimize2, RotateCw, Scissors, ScanLine, ScanText, Search, Settings,
  ShieldCheck, Signature, Sparkles, Trash2, Wrench,
} from 'lucide-react';

const toolIcon: Record<string, any> = {
  'Scan to PDF': ScanLine,
  'Image to PDF': ImagePlus,
  'JPG to PDF': FileImage,
  'Merge PDF': Combine,
  'Split PDF': Scissors,
  'Rotate PDF': RotateCw,
  'Delete Pages': Trash2,
  'Reorder Pages': ArrowUpDown,
  'Compress PDF': Minimize2,
  'Repair PDF': Wrench,
  'Sign PDF': Signature,
  Watermark: Droplets,
  'Page Numbers': Hash,
  Annotate: Settings,
  'Image to Text': ScanText,
  'Searchable PDF': Search,
  'Summarize PDF': Sparkles,
  'Ask PDF': MessageSquareText,
  'Password Protect': KeyRound,
  'Unlock PDF': Lock,
  'Secure Folder': ShieldCheck,
};

/* One colour per tool category: Create=blue, Organize=amber, Optimize=mint,
   Edit=purple, OCR & AI=mint, Security=coral. */
const toolColor: Record<string, string> = {
  'Scan to PDF': 'c-blue',
  'Image to PDF': 'c-blue',
  'JPG to PDF': 'c-blue',
  'Merge PDF': 'c-amber',
  'Split PDF': 'c-amber',
  'Rotate PDF': 'c-amber',
  'Delete Pages': 'c-amber',
  'Reorder Pages': 'c-amber',
  'Compress PDF': 'c-mint',
  'Repair PDF': 'c-mint',
  'Sign PDF': 'c-purple',
  Watermark: 'c-purple',
  'Page Numbers': 'c-purple',
  Annotate: 'c-purple',
  'Image to Text': 'c-mint',
  'Searchable PDF': 'c-mint',
  'Summarize PDF': 'c-purple',
  'Ask PDF': 'c-purple',
  'Password Protect': 'c-coral',
  'Unlock PDF': 'c-coral',
  'Secure Folder': 'c-coral',
};

export default function ToolCard({ label, onClick }: { label: string; onClick: () => void }) {
  const Icon = toolIcon[label] || FileText;
  return (
    <button className={`tool ${toolColor[label] || 'c-blue'}`} onClick={onClick}>
      <span className="tool-badge"><Icon /></span>
      <span>{label}</span>
    </button>
  );
}
