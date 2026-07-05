import { useState } from 'react';
import { Check, Pencil, Trophy } from 'lucide-react';
import type { GameMode, Match, Player } from '../types';
import { Card } from './ui/Card';
import { ScoreStepper } from './ui/ScoreStepper';
import { SwappableSlot } from './SwappableSlot';
import { PlayerChip } from './PlayerChip';

function CourtBanner({ courtNumber }: { courtNumber: number }) {
  return (
    <div className="relative h-11 bg-court-light overflow-hidden shrink-0">
      <svg viewBox="0 0 400 44" preserveAspectRatio="none" className="absolute inset-0 w-full h-full">
        <rect x="3" y="3" width="394" height="38" rx="6" fill="none" stroke="var(--color-court)" strokeOpacity="0.3" strokeWidth="2" />
        <line x1="200" y1="3" x2="200" y2="41" stroke="var(--color-court)" strokeOpacity="0.5" strokeWidth="3" />
        <line x1="110" y1="3" x2="110" y2="41" stroke="var(--color-court)" strokeOpacity="0.22" strokeWidth="1.5" />
        <line x1="290" y1="3" x2="290" y2="41" stroke="var(--color-court)" strokeOpacity="0.22" strokeWidth="1.5" />
        <line x1="110" y1="22" x2="170" y2="22" stroke="var(--color-court)" strokeOpacity="0.22" strokeWidth="1.5" />
        <line x1="230" y1="22" x2="290" y2="22" stroke="var(--color-court)" strokeOpacity="0.22" strokeWidth="1.5" />
      </svg>
      <span className="absolute inset-0 flex items-center px-4 font-display font-extrabold text-court-dark text-[13px] tracking-wide">
        КОРТ {courtNumber}
      </span>
    </div>
  );
}

function resolvePlayers(playerIds: readonly string[], players: Player[]): Player[] {
  return playerIds.map((id) => players.find((p) => p.id === id)).filter((p): p is Player => !!p);
}

interface TeamRowProps {
  teamId: string;
  playerIds: readonly string[];
  players: Player[];
  gameMode: GameMode;
  isWinner: boolean;
  isLoser: boolean;
  editable: boolean;
}

function TeamRow({ teamId, playerIds, players, gameMode, isWinner, isLoser, editable }: TeamRowProps) {
  const teamPlayers = resolvePlayers(playerIds, players);
  const rowTone = isWinner ? 'bg-court-light' : isLoser ? 'bg-loss-light' : 'bg-mist';

  const content = (
    <div className={`flex items-center gap-1.5 rounded-xl px-2 py-2 ${rowTone} transition-colors duration-200`}>
      <div className="flex items-center gap-1.5 flex-1 min-w-0 flex-wrap">
        {gameMode === 'random'
          ? teamPlayers.map((p) => (
              <SwappableSlot key={p.id} id={p.id} disabled={!editable}>
                <PlayerChip player={p} />
              </SwappableSlot>
            ))
          : teamPlayers.map((p, i) => (
              <span key={p.id} className="inline-flex items-center gap-1">
                <PlayerChip player={p} />
                {i === 0 && <span className="text-ink-muted text-xs font-bold">/</span>}
              </span>
            ))}
      </div>
      {isWinner && <Trophy size={16} className="text-court shrink-0" />}
    </div>
  );

  // Fixed mode: the whole pair drags together as one unit.
  if (gameMode === 'fixed') {
    return (
      <SwappableSlot id={teamId} disabled={!editable}>
        {content}
      </SwappableSlot>
    );
  }
  return content;
}

interface CourtMatchCardProps {
  match: Match;
  players: Player[];
  gameMode: GameMode;
  /** Whether the round can still be edited (drag-and-drop, score entry). False once the round is completed. */
  editable: boolean;
  onSubmitScore: (matchId: string, scoreA: number, scoreB: number) => void;
}

export function CourtMatchCard({ match, players, gameMode, editable, onSubmitScore }: CourtMatchCardProps) {
  const isScored = match.winner !== null;
  const [isEditingScore, setIsEditingScore] = useState(!isScored);
  const [draftA, setDraftA] = useState(match.scoreA ?? 0);
  const [draftB, setDraftB] = useState(match.scoreB ?? 0);

  const showEntry = editable && isEditingScore;

  const handleConfirm = () => {
    onSubmitScore(match.id, draftA, draftB);
    setIsEditingScore(false);
  };

  return (
    <Card className="overflow-hidden">
      <CourtBanner courtNumber={match.court} />
      <div className="p-3 space-y-2">
        <TeamRow
          teamId={match.teamA.id}
          playerIds={match.teamA.playerIds}
          players={players}
          gameMode={gameMode}
          isWinner={match.winner === 'A'}
          isLoser={match.winner === 'B'}
          editable={editable && !isEditingScore}
        />
        <div className="flex items-center gap-2 px-1">
          <div className="flex-1 h-px bg-line" />
          <span className="text-[11px] font-bold text-ink-muted tracking-wider">VS</span>
          <div className="flex-1 h-px bg-line" />
        </div>
        <TeamRow
          teamId={match.teamB.id}
          playerIds={match.teamB.playerIds}
          players={players}
          gameMode={gameMode}
          isWinner={match.winner === 'B'}
          isLoser={match.winner === 'A'}
          editable={editable && !isEditingScore}
        />

        <div className="pt-1">
          {showEntry ? (
            <div className="flex items-center justify-between gap-2 bg-mist rounded-xl px-2 py-2">
              <ScoreStepper value={draftA} onChange={setDraftA} accentClass="text-court-dark" />
              <span className="text-ink-muted font-bold text-sm">:</span>
              <ScoreStepper value={draftB} onChange={setDraftB} accentClass="text-loss" />
              <button
                type="button"
                onClick={handleConfirm}
                aria-label="Підтвердити рахунок"
                className="h-11 w-11 shrink-0 rounded-xl bg-court text-white flex items-center justify-center active:bg-court-dark transition-colors"
              >
                <Check size={20} />
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between px-1 pt-1">
              <span className="font-display font-extrabold text-2xl tabular-nums text-ink">
                {match.scoreA ?? '–'} : {match.scoreB ?? '–'}
              </span>
              {editable && (
                <button
                  type="button"
                  onClick={() => setIsEditingScore(true)}
                  className="h-9 px-3 rounded-lg text-court-dark text-sm font-semibold flex items-center gap-1.5 active:bg-court-light transition-colors"
                >
                  <Pencil size={14} /> Змінити
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
