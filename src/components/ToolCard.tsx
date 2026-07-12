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

export default function ToolCard({ label, onClick }: { label: string; onClick: () => void }) {
  const Icon = toolIcon[label] || FileText;
  return (
    <button className="tool" onClick={onClick}>
      <Icon size={22} />
      <span>{label}</span>
    </button>
  );
}
