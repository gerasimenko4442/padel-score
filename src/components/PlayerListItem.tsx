import { X } from 'lucide-react';
import type { Player } from '../types';
import { GenderDot } from './PlayerChip';

interface PlayerListItemProps {
  player: Player;
  onRemove: (id: string) => void;
}

export function PlayerListItem({ player, onRemove }: PlayerListItemProps) {
  return (
    <div className="flex items-center gap-3 py-2.5 px-1 border-b border-line last:border-0">
      <GenderDot gender={player.gender} size={9} />
      <span className="font-semibold text-[15px] text-ink flex-1 truncate">{player.name}</span>
      <button
        type="button"
        onClick={() => onRemove(player.id)}
        aria-label={`Видалити ${player.name}`}
        className="h-9 w-9 rounded-full flex items-center justify-center text-ink-muted active:bg-loss-light active:text-loss transition-colors shrink-0"
      >
        <X size={17} />
      </button>
    </div>
  );
}
