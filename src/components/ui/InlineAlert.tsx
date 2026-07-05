import type { ReactNode } from 'react';
import { AlertTriangle, Info, X } from 'lucide-react';

type Tone = 'error' | 'warning' | 'info';

const TONE_STYLES: Record<Tone, string> = {
  error: 'bg-loss-light text-loss',
  warning: 'bg-amber-50 text-amber-700',
  info: 'bg-info-light text-info',
};

const TONE_ICON: Record<Tone, ReactNode> = {
  error: <AlertTriangle size={16} className="shrink-0 mt-0.5" />,
  warning: <AlertTriangle size={16} className="shrink-0 mt-0.5" />,
  info: <Info size={16} className="shrink-0 mt-0.5" />,
};

interface InlineAlertProps {
  tone?: Tone;
  children: ReactNode;
  onDismiss?: () => void;
}

export function InlineAlert({ tone = 'error', children, onDismiss }: InlineAlertProps) {
  return (
    <div className={`flex items-start gap-2 rounded-xl px-3.5 py-2.5 text-sm font-medium leading-snug ${TONE_STYLES[tone]}`} role="alert">
      {TONE_ICON[tone]}
      <span className="flex-1">{children}</span>
      {onDismiss && (
        <button onClick={onDismiss} aria-label="Закрити" className="shrink-0 opacity-60 active:opacity-100 p-0.5">
          <X size={15} />
        </button>
      )}
    </div>
  );
}
