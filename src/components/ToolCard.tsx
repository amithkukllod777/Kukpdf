import {
  Combine, FileText, ImagePlus, KeyRound, Lock, Minimize2, RotateCw, ScanLine, Search,
  Settings, ShieldCheck, Signature, Sparkles, Trash2, Wrench,
} from 'lucide-react';

const toolIcon: Record<string, any> = {
  'Scan to PDF': ScanLine,
  'Image to PDF': ImagePlus,
  'JPG to PDF': ImagePlus,
  'Merge PDF': Combine,
  'Split PDF': Wrench,
  'Rotate PDF': RotateCw,
  'Delete Pages': Trash2,
  'Reorder Pages': Combine,
  'Compress PDF': Minimize2,
  'Repair PDF': Wrench,
  'Sign PDF': Signature,
  Watermark: ShieldCheck,
  'Page Numbers': FileText,
  Annotate: Settings,
  'Image to Text': Search,
  'Searchable PDF': Search,
  'Summarize PDF': Sparkles,
  'Ask PDF': Sparkles,
  'Password Protect': KeyRound,
  'Unlock PDF': Lock,
  'Secure Folder': ShieldCheck,
};

export default function ToolCard({ label, onClick }: { label: string; onClick: () => void }) {
  const Icon = toolIcon[label] || FileText;
  return (
    <button className="tool" onClick={onClick}>
      <Icon size={22} />
      <span>{label}</span>
    </button>
  );
}
