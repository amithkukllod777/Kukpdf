import type { ComponentType, ReactNode } from 'react';

/**
 * A calm, centred empty-state block (icon in a soft accent circle, heading,
 * subtext, optional action) — replaces the bare floating "nothing here" line.
 * Kuklabs design system: single accent, neutral text, no decoration.
 */
export default function EmptyState({
  icon: Icon, title, subtitle, action,
}: {
  icon: ComponentType<{ size?: number }>;
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div className="empty-state">
      <span className="es-ico"><Icon size={30} /></span>
      <b>{title}</b>
      {subtitle && <span>{subtitle}</span>}
      {action}
    </div>
  );
}
