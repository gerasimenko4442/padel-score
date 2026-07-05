import { useState } from 'react';
import { ChevronDown, Repeat2, Swords, TrendingUp, Coffee } from 'lucide-react';
import type { Player } from '../types';
import { GenderDot } from './PlayerChip';

interface LeaderboardRowProps {
  place: number;
  player: Player;
  players: Player[];
}

function placeTone(place: number): string {
  if (place === 1) return 'bg-gold text-white';
  if (place === 2) return 'bg-silver text-white';
  if (place === 3) return 'bg-bronze text-white';
  return 'bg-mist text-ink-muted';
}

function nameOf(players: Player[], id: string | null): string {
  if (!id) return '—';
  return players.find((p) => p.id === id)?.name ?? '—';
}

function LeaderboardRow({ place, player, players }: LeaderboardRowProps) {
  const [open, setOpen] = useState(false);
  const s = player.stats;

  return (
    <div className="border-b border-line last:border-0">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-3 py-3 active:bg-mist/60 transition-colors rounded-lg px-1"
      >
        <span className={`h-7 w-7 shrink-0 rounded-full flex items-center justify-center font-display font-bold text-xs ${placeTone(place)}`}>
          {place}
        </span>
        <GenderDot gender={player.gender} size={7} />
        <span className="font-semibold text-[15px] text-ink flex-1 text-left truncate">{player.name}</span>
        <span className="font-display font-bold text-sm tabular-nums text-court-dark shrink-0">{s.wins}В</span>
        <span className="font-display font-bold text-sm tabular-nums text-ink-muted shrink-0 w-10 text-right">
          {s.pointsDifference > 0 ? '+' : ''}
          {s.pointsDifference}
        </span>
        <ChevronDown size={16} className={`text-ink-muted shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="grid grid-cols-2 gap-2 pb-3 px-1 text-xs">
          <div className="flex items-center gap-1.5 bg-mist rounded-lg px-2.5 py-2">
            <TrendingUp size={13} className="text-court-dark shrink-0" />
            <span className="text-ink-muted">Матчі / серія:</span>
            <span className="font-semibold text-ink ml-auto">
              {s.matchesPlayed} · {s.winStreak}🔥
            </span>
          </div>
          <div className="flex items-center gap-1.5 bg-mist rounded-lg px-2.5 py-2">
            <Coffee size={13} className="text-ink-muted shrink-0" />
            <span className="text-ink-muted">Відпочинок:</span>
            <span className="font-semibold text-ink ml-auto">{s.restCount}</span>
          </div>
          <div className="flex items-center gap-1.5 bg-mist rounded-lg px-2.5 py-2 col-span-1">
            <Repeat2 size={13} className="text-info shrink-0" />
            <span className="text-ink-muted truncate">Частий партнер:</span>
            <span className="font-semibold text-ink ml-auto truncate">{nameOf(players, s.mostFrequentPartnerId)}</span>
          </div>
          <div className="flex items-center gap-1.5 bg-mist rounded-lg px-2.5 py-2 col-span-1">
            <Swords size={13} className="text-loss shrink-0" />
            <span className="text-ink-muted truncate">Частий суперник:</span>
            <span className="font-semibold text-ink ml-auto truncate">{nameOf(players, s.mostFrequentOpponentId)}</span>
          </div>
        </div>
      )}
    </div>
  );
}

interface LeaderboardListProps {
  ranked: Player[];
}

export function LeaderboardList({ ranked }: LeaderboardListProps) {
  return (
    <div className="px-2">
      {ranked.map((player, i) => (
        <LeaderboardRow key={player.id} place={i + 1} player={player} players={ranked} />
      ))}
    </div>
  );
}
