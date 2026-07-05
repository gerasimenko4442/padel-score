import { Crown } from 'lucide-react';
import type { Player } from '../types';
import { GenderDot } from './PlayerChip';

interface PodiumProps {
  ranked: Player[];
}

const STEP_STYLES = [
  { order: 'order-2', height: 'h-28', tone: 'bg-gold', label: '1' },
  { order: 'order-1', height: 'h-20', tone: 'bg-silver', label: '2' },
  { order: 'order-3', height: 'h-14', tone: 'bg-bronze', label: '3' },
] as const;

export function Podium({ ranked }: PodiumProps) {
  const top3 = [ranked[1], ranked[0], ranked[2]]; // rendered left-to-right as 2nd, 1st, 3rd

  return (
    <div className="flex items-end justify-center gap-2 px-2 pt-6 pb-2">
      {top3.map((player, i) => {
        // Safe: top3 and STEP_STYLES both always have exactly 3 entries.
        const style = STEP_STYLES[i]!;
        if (!player) return <div key={i} className="flex-1 max-w-[100px]" />;
        return (
          <div key={player.id} className={`flex flex-col items-center flex-1 max-w-[110px] ${style.order}`}>
            {i === 1 && <Crown size={22} className="text-gold mb-1" fill="currentColor" />}
            <div className="flex items-center gap-1 mb-1.5 max-w-full">
              <GenderDot gender={player.gender} size={7} />
              <span className="font-display font-bold text-sm text-ink truncate">{player.name}</span>
            </div>
            <span className="text-xs text-ink-muted font-medium mb-2">
              {player.stats.wins}В · {player.stats.pointsDifference > 0 ? '+' : ''}
              {player.stats.pointsDifference}
            </span>
            <div className={`w-full rounded-t-xl ${style.height} ${style.tone} flex items-start justify-center pt-2 shadow-soft`}>
              <span className="font-display font-extrabold text-2xl text-white">{style.label}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
