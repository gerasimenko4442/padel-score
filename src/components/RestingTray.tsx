import { Coffee } from 'lucide-react';
import type { GameMode, Player, Team } from '../types';
import { SwappableSlot } from './SwappableSlot';
import { PlayerChip } from './PlayerChip';

interface RestingTrayProps {
  restingPlayerIds: string[];
  players: Player[];
  fixedTeams: Team[];
  gameMode: GameMode;
  editable: boolean;
}

export function RestingTray({ restingPlayerIds, players, fixedTeams, gameMode, editable }: RestingTrayProps) {
  if (restingPlayerIds.length === 0) {
    return (
      <div className="flex items-center gap-2 text-ink-muted text-sm px-1 py-2">
        <Coffee size={16} />
        <span>Цього раунду грають усі — ніхто не відпочиває</span>
      </div>
    );
  }

  const restingSet = new Set(restingPlayerIds);
  // In fixed mode, group resting players by their team so partners show up together.
  const items: { id: string; node: React.ReactNode }[] =
    gameMode === 'fixed'
      ? fixedTeams
          .filter((t) => t.playerIds.every((id) => restingSet.has(id)))
          .map((t) => {
            const teamPlayers = t.playerIds.map((id) => players.find((p) => p.id === id)).filter((p): p is Player => !!p);
            return {
              id: t.id,
              node: (
                <span className="inline-flex items-center gap-1">
                  {teamPlayers.map((p) => (
                    <PlayerChip key={p.id} player={p} showGrip={editable} />
                  ))}
                </span>
              ),
            };
          })
      : players
          .filter((p) => restingSet.has(p.id))
          .map((p) => ({ id: p.id, node: <PlayerChip player={p} showGrip={editable} /> }));

  return (
    <div className="rounded-2xl border border-dashed border-line px-3 py-3">
      <div className="flex items-center gap-1.5 text-ink-muted text-xs font-bold uppercase tracking-wide mb-2 px-1">
        <Coffee size={14} />
        Відпочивають
      </div>
      <div className="flex flex-wrap gap-2">
        {items.map((item) => (
          <SwappableSlot key={item.id} id={item.id} disabled={!editable}>
            {item.node}
          </SwappableSlot>
        ))}
      </div>
    </div>
  );
}
