import Header from '../components/Header';
import ToolCard from '../components/ToolCard';
import type { Tab } from '../types';

const toolGroups = [
  ['Create', ['Scan to PDF', 'Image to PDF', 'JPG to PDF']],
  ['Organize', ['Merge PDF', 'Split PDF', 'Rotate PDF', 'Delete Pages', 'Reorder Pages']],
  ['Optimize', ['Compress PDF', 'Repair PDF']],
  ['Edit', ['Sign PDF', 'Watermark', 'Page Numbers', 'Annotate']],
  ['OCR & AI', ['Image to Text', 'Searchable PDF', 'Summarize PDF', 'Ask PDF']],
  ['Security', ['Password Protect', 'Unlock PDF', 'Secure Folder']],
] as const;

export default function ToolsPage({ setTab, onOpenTool }: { setTab: (t: Tab) => void; onOpenTool: (tool: string) => void }) {
  return (
    <section>
      <Header title="PDF Tools" sub="Create, organize, optimize, edit, OCR and secure PDFs" />
      {toolGroups.map(([group, tools]) => (
        <div key={group}>
          <h2>{group}</h2>
          <div className="grid">
            {tools.map((t) => (
              <ToolCard key={t} label={t} onClick={() => (t === 'Scan to PDF' ? setTab('scan') : onOpenTool(t))} />
            ))}
          </div>
        </div>
      ))}
    </section>
  );
}
