import type { ReactNode } from 'react';

type ChipTone = 'court' | 'loss' | 'info' | 'neutral' | 'gold' | 'silver' | 'bronze';

const TONE_CLASSES: Record<ChipTone, string> = {
  court: 'bg-court-light text-court-dark',
  loss: 'bg-loss-light text-loss',
  info: 'bg-info-light text-info',
  neutral: 'bg-mist text-ink-muted border border-line',
  gold: 'bg-gold/15 text-gold',
  silver: 'bg-silver/20 text-ink-muted',
  bronze: 'bg-bronze/15 text-bronze',
};

interface ChipProps {
  tone?: ChipTone;
  children: ReactNode;
  className?: string;
}

export function Chip({ tone = 'neutral', children, className = '' }: ChipProps) {
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${TONE_CLASSES[tone]} ${className}`}>
      {children}
    </span>
  );
}
