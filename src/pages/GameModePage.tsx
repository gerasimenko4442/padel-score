import { ArrowRight, Shuffle, Users2 } from 'lucide-react';
import type { GameMode, Player, Team } from '../types';
import { ScreenLayout } from '../components/ui/ScreenLayout';
import { Button } from '../components/ui/Button';
import { InlineAlert } from '../components/ui/InlineAlert';
import { FixedTeamsEditor } from '../components/FixedTeamsEditor';

interface ModeOptionProps {
  active: boolean;
  icon: React.ReactNode;
  title: string;
  description: string;
  onClick: () => void;
}

function ModeOption({ active, icon, title, description, onClick }: ModeOptionProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full text-left rounded-2xl p-4 border-2 transition-colors duration-200 flex items-start gap-3 ${
        active ? 'border-court bg-court-light' : 'border-line bg-white'
      }`}
    >
      <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${active ? 'bg-court text-white' : 'bg-mist text-ink-muted'}`}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="font-display font-bold text-[15px] text-ink">{title}</p>
        <p className="text-xs text-ink-muted mt-0.5 leading-relaxed">{description}</p>
      </div>
    </button>
  );
}

interface GameModePageProps {
  gameMode: GameMode;
  fixedTeams: Team[];
  players: Player[];
  error: string | null;
  onClearError: () => void;
  onSetMode: (mode: GameMode) => boolean;
  onSwapFixedPlayers: (idA: string, idB: string) => void;
  onShuffleFixedTeams: () => void;
  onBack: () => void;
  onNext: () => void;
}

export function GameModePage({
  gameMode,
  fixedTeams,
  players,
  error,
  onClearError,
  onSetMode,
  onSwapFixedPlayers,
  onShuffleFixedTeams,
  onBack,
  onNext,
}: GameModePageProps) {
  return (
    <ScreenLayout
      onBack={onBack}
      progress={{ total: 6, current: 2 }}
      footer={
        <Button fullWidth icon={<ArrowRight size={20} />} onClick={onNext}>
          Продовжити
        </Button>
      }
    >
      <div className="pt-6 space-y-4">
        <div>
          <p className="font-display font-extrabold text-2xl text-ink mb-1">Режим гри</p>
          <p className="text-ink-muted text-sm">Як формуються пари протягом гри</p>
        </div>

        {error && <InlineAlert onDismiss={onClearError}>{error}</InlineAlert>}

        <div className="space-y-2.5">
          <ModeOption
            active={gameMode === 'random'}
            icon={<Shuffle size={18} />}
            title="Випадкові пари"
            description="Пари змінюються щораунду для максимальної справедливості й нових зустрічей"
            onClick={() => onSetMode('random')}
          />
          <ModeOption
            active={gameMode === 'fixed'}
            icon={<Users2 size={18} />}
            title="Фіксовані пари"
            description="Пари незмінні весь турнір, змінюються лише суперники по корту"
            onClick={() => onSetMode('fixed')}
          />
        </div>

        {gameMode === 'fixed' && fixedTeams.length > 0 && (
          <div className="pt-2">
            <FixedTeamsEditor teams={fixedTeams} players={players} onSwap={onSwapFixedPlayers} onShuffle={onShuffleFixedTeams} />
          </div>
        )}
      </div>
    </ScreenLayout>
  );
}
