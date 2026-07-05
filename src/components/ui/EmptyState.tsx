import type { ReactNode } from 'react';

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center text-center gap-3 py-10 px-6">
      {icon && <div className="text-court/70">{icon}</div>}
      <p className="font-display font-extrabold text-lg text-ink">{title}</p>
      {description && <p className="text-sm text-ink-muted max-w-[30ch] leading-relaxed">{description}</p>}
      {action}
    </div>
  );
}
