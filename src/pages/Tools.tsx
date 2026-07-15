import Header from '../components/Header';
import ToolCard from '../components/ToolCard';
import type { Tab } from '../types';
import { useT, useToolName } from '../i18n';

const toolGroups = [
  ['Create', ['Scan to PDF', 'Image to PDF', 'JPG to PDF']],
  ['Organize', ['Merge PDF', 'Split PDF', 'Rotate PDF', 'Delete Pages', 'Reorder Pages']],
  ['Optimize', ['Compress PDF', 'Repair PDF']],
  ['Convert', ['PDF to Word', 'PDF to Excel']],
  ['Edit', ['Sign PDF', 'Watermark', 'Page Numbers', 'Annotate']],
  ['OCR & AI', ['Image to Text', 'Searchable PDF', 'Summarize PDF', 'Ask PDF']],
  ['Security', ['Password Protect', 'Unlock PDF', 'Secure Folder']],
] as const;

export const ALL_TOOLS: string[] = toolGroups.flatMap(([, tools]) => tools);

export default function ToolsPage({ setTab, onOpenTool }: { setTab: (t: Tab) => void; onOpenTool: (tool: string) => void }) {
  const t = useT();
  const toolName = useToolName();
  return (
    <section>
      <Header title={t('tools.title')} sub={t('tools.sub')} />
      {toolGroups.map(([group, tools]) => (
        <div key={group}>
          <h2>{t(`tools.group.${group}`)}</h2>
          <div className="grid">
            {tools.map((name) => (
              <ToolCard key={name} label={toolName(name)} onClick={() => (name === 'Scan to PDF' ? setTab('scan') : name === 'Secure Folder' ? setTab('profile') : onOpenTool(name))} />
            ))}
          </div>
        </div>
      ))}
    </section>
  );
}
