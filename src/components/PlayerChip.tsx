import type { Gender, Player } from '../types';
import { GripVertical } from 'lucide-react';

export function GenderDot({ gender, size = 8 }: { gender: Gender; size?: number }) {
  return (
    <span
      className="rounded-full shrink-0"
      style={{ width: size, height: size, background: gender === 'male' ? 'var(--color-info)' : 'var(--color-accent)' }}
    />
  );
}

interface PlayerChipProps {
  player: Player;
  showGrip?: boolean;
  className?: string;
}

/** A compact "this is a person" pill: gender dot + name. Used everywhere a player appears. */
export function PlayerChip({ player, showGrip = false, className = '' }: PlayerChipProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 bg-white rounded-lg pl-1.5 pr-2.5 py-1.5 shadow-sm min-w-0 ${className}`}
    >
      {showGrip && <GripVertical size={14} className="text-ink-muted/50 shrink-0" />}
      <GenderDot gender={player.gender} />
      <span className="font-semibold text-sm text-ink truncate">{player.name}</span>
    </span>
  );
}
