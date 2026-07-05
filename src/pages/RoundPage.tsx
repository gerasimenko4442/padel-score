import { useState } from 'react';
import { DndContext, type DragEndEvent, PointerSensor, KeyboardSensor, useSensor, useSensors } from '@dnd-kit/core';
import { ArrowRight, Coffee, Flag, Shuffle } from 'lucide-react';
import type { GameState, Round } from '../types';
import { ScreenLayout } from '../components/ui/ScreenLayout';
import { Button } from '../components/ui/Button';
import { InlineAlert } from '../components/ui/InlineAlert';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { CourtMatchCard } from '../components/CourtMatchCard';
import { RestingTray } from '../components/RestingTray';
import { PlayerChip } from '../components/PlayerChip';

interface RoundPageProps {
  state: GameState;
  currentRound: Round;
  isCurrentRoundFullyScored: boolean;
  error: string | null;
  onClearError: () => void;
  genderWarning: string | null;
  onClearGenderWarning: () => void;
  onSubmitScore: (matchId: string, scoreA: number, scoreB: number) => boolean;
  onReroll: () => boolean;
  onSwapInRound: (idA: string, idB: string) => void;
  onToggleVoluntaryRest: (playerId: string) => void;
  onAdvance: (finish: boolean) => void;
  onResetGame: () => void;
}

export function RoundPage({
  state,
  currentRound,
  isCurrentRoundFullyScored,
  error,
  onClearError,
  genderWarning,
  onClearGenderWarning,
  onSubmitScore,
  onReroll,
  onSwapInRound,
  onToggleVoluntaryRest,
  onAdvance,
  onResetGame,
}: RoundPageProps) {
  const [confirmFinish, setConfirmFinish] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);

  const lineupEditable = currentRound.matches.every((m) => m.winner === null);
  const totalPlaying = state.players.length - currentRound.restingPlayerIds.length;

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) onSwapInRound(String(active.id), String(over.id));
  };

  return (
    <ScreenLayout
      title={`Раунд ${currentRound.index}`}
      footer={
        isCurrentRoundFullyScored ? (
          <div className="space-y-2">
            <Button fullWidth icon={<ArrowRight size={20} />} onClick={() => onAdvance(false)}>
              Наступний раунд
            </Button>
            <Button variant="ghost" fullWidth size="md" icon={<Flag size={16} />} onClick={() => setConfirmFinish(true)}>
              Завершити гру
            </Button>
          </div>
        ) : (
          <Button fullWidth disabled className="opacity-50">
            Введіть рахунок усіх матчів
          </Button>
        )
      }
    >
      <div className="pt-4 space-y-3">
        <p className="text-xs text-ink-muted px-1">
          {totalPlaying} грають · {currentRound.restingPlayerIds.length} відпочивають
        </p>

        {error && <InlineAlert onDismiss={onClearError}>{error}</InlineAlert>}

        {genderWarning && (
          <InlineAlert tone="warning" onDismiss={onClearGenderWarning}>
            {genderWarning}
          </InlineAlert>
        )}

        <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
          <RestingTray
            restingPlayerIds={currentRound.restingPlayerIds}
            players={state.players}
            fixedTeams={state.fixedTeams}
            gameMode={state.settings.gameMode}
            editable={lineupEditable}
          />

          {lineupEditable && (
            <button
              type="button"
              onClick={onReroll}
              className="w-full flex items-center justify-center gap-1.5 text-court-dark text-sm font-semibold py-1 active:opacity-70"
            >
              <Shuffle size={14} /> Перегенерувати пари
            </button>
          )}

          <div className="space-y-3">
            {currentRound.matches.map((match) => (
              <CourtMatchCard
                key={match.id}
                match={match}
                players={state.players}
                gameMode={state.settings.gameMode}
                editable={lineupEditable}
                onSubmitScore={onSubmitScore}
              />
            ))}
          </div>
        </DndContext>

        {isCurrentRoundFullyScored && (
          <VoluntaryRestPanel players={state.players} onToggle={onToggleVoluntaryRest} />
        )}

        <button
          type="button"
          onClick={() => setConfirmReset(true)}
          className="w-full text-center text-xs text-ink-muted/70 underline underline-offset-2 pt-2 pb-1"
        >
          Скинути гру
        </button>
      </div>

      <ConfirmDialog
        open={confirmFinish}
        title="Завершити гру зараз?"
        description="Поточний раунд збережеться, а гра перейде одразу до фінальних результатів."
        confirmLabel="Завершити"
        onConfirm={() => {
          setConfirmFinish(false);
          onAdvance(true);
        }}
        onCancel={() => setConfirmFinish(false)}
      />

      <ConfirmDialog
        open={confirmReset}
        title="Скинути гру?"
        description="Весь прогрес, гравці та результати будуть видалені без можливості відновлення."
        confirmLabel="Скинути"
        danger
        onConfirm={() => {
          setConfirmReset(false);
          onResetGame();
        }}
        onCancel={() => setConfirmReset(false)}
      />
    </ScreenLayout>
  );
}

interface VoluntaryRestPanelProps {
  players: GameState['players'];
  onToggle: (playerId: string) => void;
}

function VoluntaryRestPanel({ players, onToggle }: VoluntaryRestPanelProps) {
  return (
    <div className="rounded-2xl bg-white shadow-soft p-3.5">
      <div className="flex items-center gap-1.5 text-xs font-bold text-ink-muted uppercase tracking-wide mb-2.5">
        <Coffee size={14} />
        Хтось хоче відпочити наступного раунду?
      </div>
      <div className="flex flex-wrap gap-2">
        {players.map((p) => (
          <button key={p.id} type="button" onClick={() => onToggle(p.id)}>
            <PlayerChip
              player={p}
              className={p.wantsRestNextRound ? 'ring-2 ring-court bg-court-light' : ''}
            />
          </button>
        ))}
      </div>
    </div>
  );
}
