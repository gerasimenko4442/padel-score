import { useState } from 'react';
import { ChevronDown, Download, Loader2, RotateCcw, Trophy } from 'lucide-react';
import type { GameState, Round } from '../types';
import { sortPlayersForLeaderboard } from '../utils/statistics';
import { ScreenLayout } from '../components/ui/ScreenLayout';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Podium } from '../components/Podium';
import { LeaderboardList } from '../components/LeaderboardList';

interface RoundHistoryItemProps {
  round: Round;
  players: GameState['players'];
}

function RoundHistoryItem({ round, players }: RoundHistoryItemProps) {
  const [open, setOpen] = useState(false);
  const name = (id: string) => players.find((p) => p.id === id)?.name ?? '?';

  return (
    <div className="border-b border-line last:border-0">
      <button type="button" onClick={() => setOpen((o) => !o)} className="w-full flex items-center gap-2 py-3 px-1">
        <span className="font-display font-bold text-sm text-ink">Раунд {round.index}</span>
        <span className="text-xs text-ink-muted flex-1 text-left">{round.matches.length} матчів</span>
        <ChevronDown size={16} className={`text-ink-muted transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="space-y-1.5 pb-3 px-1">
          {round.matches.map((m) => (
            <div key={m.id} className="flex items-center gap-2 text-xs bg-mist rounded-lg px-2.5 py-2">
              <span className="text-ink-muted font-semibold shrink-0">К{m.court}</span>
              <span className={`flex-1 truncate font-medium ${m.winner === 'A' ? 'text-court-dark font-bold' : 'text-ink'}`}>
                {m.teamA.playerIds.map(name).join(' / ')}
              </span>
              <span className="font-display font-bold tabular-nums text-ink shrink-0">
                {m.scoreA} : {m.scoreB}
              </span>
              <span className={`flex-1 truncate text-right font-medium ${m.winner === 'B' ? 'text-court-dark font-bold' : 'text-ink'}`}>
                {m.teamB.playerIds.map(name).join(' / ')}
              </span>
            </div>
          ))}
          {round.restingPlayerIds.length > 0 && (
            <p className="text-[11px] text-ink-muted px-1 pt-1">
              Відпочивали: {round.restingPlayerIds.map(name).join(', ')}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

interface FinalResultsPageProps {
  state: GameState;
  onNewGame: () => void;
}

export function FinalResultsPage({ state, onNewGame }: FinalResultsPageProps) {
  const ranked = sortPlayersForLeaderboard(state.players);
  const completedRounds = state.rounds.filter((r) => r.completed);
  const [exporting, setExporting] = useState(false);

  // The PDF service (and jsPDF itself, ~150kb+) is only fetched the moment
  // someone actually wants a report, instead of bloating the initial bundle
  // every player has to download just to play a game.
  const handleExportPdf = async () => {
    setExporting(true);
    try {
      const { exportGameToPdf } = await import('../services/pdfService');
      exportGameToPdf(state);
    } finally {
      setExporting(false);
    }
  };

  return (
    <ScreenLayout
      title="Результати"
      footer={
        <div className="space-y-2">
          <Button
            fullWidth
            disabled={exporting}
            icon={exporting ? <Loader2 size={20} className="animate-spin" /> : <Download size={20} />}
            onClick={handleExportPdf}
          >
            {exporting ? 'Готуємо PDF…' : 'Завантажити PDF звіт'}
          </Button>
          <Button variant="secondary" fullWidth size="md" icon={<RotateCcw size={16} />} onClick={onNewGame}>
            Нова гра
          </Button>
        </div>
      }
    >
      <div className="pt-2 space-y-5">
        <Card className="pt-2 pb-4">
          <Podium ranked={ranked} />
        </Card>

        <div>
          <div className="flex items-center gap-1.5 px-1 mb-2">
            <Trophy size={15} className="text-court-dark" />
            <p className="font-display font-extrabold text-base text-ink">Турнірна таблиця</p>
          </div>
          <Card className="py-1">
            <LeaderboardList ranked={ranked} />
          </Card>
        </div>

        <div>
          <p className="font-display font-extrabold text-base text-ink px-1 mb-2">Історія раундів</p>
          <Card className="px-3 py-1">
            {completedRounds.map((round) => (
              <RoundHistoryItem key={round.id} round={round} players={state.players} />
            ))}
          </Card>
        </div>
      </div>
    </ScreenLayout>
  );
}
