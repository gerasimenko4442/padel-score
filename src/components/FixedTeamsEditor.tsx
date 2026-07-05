import { DndContext, type DragEndEvent, PointerSensor, KeyboardSensor, useSensor, useSensors } from '@dnd-kit/core';
import { Shuffle } from 'lucide-react';
import type { Player, Team } from '../types';
import { Card } from './ui/Card';
import { SwappableSlot } from './SwappableSlot';
import { PlayerChip } from './PlayerChip';

interface FixedTeamsEditorProps {
  teams: Team[];
  players: Player[];
  onSwap: (playerIdA: string, playerIdB: string) => void;
  onShuffle: () => void;
}

export function FixedTeamsEditor({ teams, players, onSwap, onShuffle }: FixedTeamsEditorProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      onSwap(String(active.id), String(over.id));
    }
  };

  const playerById = new Map(players.map((p) => [p.id, p]));

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between px-1">
        <p className="text-xs font-bold text-ink-muted uppercase tracking-wide">Перетягніть, щоб змінити пари</p>
        <button
          type="button"
          onClick={onShuffle}
          className="inline-flex items-center gap-1.5 text-court-dark text-sm font-semibold active:opacity-70"
        >
          <Shuffle size={14} /> Перемішати
        </button>
      </div>

      <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-1 gap-2.5">
          {teams.map((team, i) => (
            <Card key={team.id} className="p-3 flex items-center gap-2">
              <span className="font-display font-extrabold text-xs text-ink-muted w-6 shrink-0">#{i + 1}</span>
              <div className="flex items-center gap-2 flex-1 flex-wrap">
                {team.playerIds.map((pid) => {
                  const player = playerById.get(pid);
                  if (!player) return null;
                  return (
                    <SwappableSlot key={pid} id={pid}>
                      <PlayerChip player={player} showGrip />
                    </SwappableSlot>
                  );
                })}
              </div>
            </Card>
          ))}
        </div>
      </DndContext>
    </div>
  );
}
