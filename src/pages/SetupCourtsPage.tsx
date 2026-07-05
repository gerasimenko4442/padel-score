import { Play } from 'lucide-react';
import type { GameMode } from '../types';
import { ScreenLayout } from '../components/ui/ScreenLayout';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { InlineAlert } from '../components/ui/InlineAlert';

interface SetupCourtsPageProps {
  playerCount: number;
  courtsCount: number;
  gameMode: GameMode;
  genderRulesEnabled: boolean;
  error: string | null;
  onClearError: () => void;
  onSetCourtsCount: (n: number) => void;
  onSetGenderRules: (enabled: boolean) => void;
  onBack: () => void;
  onStart: () => void;
}

export function SetupCourtsPage({
  playerCount,
  courtsCount,
  gameMode,
  genderRulesEnabled,
  error,
  onClearError,
  onSetCourtsCount,
  onSetGenderRules,
  onBack,
  onStart,
}: SetupCourtsPageProps) {
  const maxSlots = courtsCount * 4;
  const playing = Math.min(playerCount, maxSlots) - (Math.min(playerCount, maxSlots) % 4);
  const resting = playerCount - playing;

  return (
    <ScreenLayout
      onBack={onBack}
      progress={{ total: 6, current: 3 }}
      footer={
        <Button fullWidth icon={<Play size={20} fill="currentColor" />} onClick={onStart}>
          Почати гру
        </Button>
      }
    >
      <div className="pt-6 space-y-4">
        <div>
          <p className="font-display font-extrabold text-2xl text-ink mb-1">Корти</p>
          <p className="text-ink-muted text-sm">Скільки кортів доступно сьогодні</p>
        </div>

        {error && <InlineAlert onDismiss={onClearError}>{error}</InlineAlert>}

        <Card className="p-4 flex items-center justify-between">
          <div>
            <p className="font-semibold text-ink">Кількість кортів</p>
            <p className="text-xs text-ink-muted mt-0.5">1 корт = 4 гравці</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => onSetCourtsCount(Math.max(1, courtsCount - 1))}
              className="h-11 w-11 rounded-xl bg-mist active:bg-line flex items-center justify-center text-xl font-bold text-ink"
            >
              −
            </button>
            <span className="font-display font-extrabold text-2xl w-6 text-center tabular-nums">{courtsCount}</span>
            <button
              type="button"
              onClick={() => onSetCourtsCount(courtsCount + 1)}
              className="h-11 w-11 rounded-xl bg-mist active:bg-line flex items-center justify-center text-xl font-bold text-ink"
            >
              +
            </button>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-ink-muted">Гратимуть цей раунд</span>
            <span className="font-display font-bold text-court-dark tabular-nums">{Math.max(playing, 0)}</span>
          </div>
          <div className="flex items-center justify-between text-sm mt-1.5">
            <span className="text-ink-muted">Відпочиватимуть</span>
            <span className="font-display font-bold text-ink tabular-nums">{Math.max(resting, 0)}</span>
          </div>
        </Card>

        {gameMode === 'random' && (
          <Card className="p-4 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="font-semibold text-ink">Гендерні правила</p>
              <p className="text-xs text-ink-muted mt-0.5 leading-relaxed">
                Лише Ч/Ч, Ж/Ж або змішані пари одна проти одної
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={genderRulesEnabled}
              onClick={() => onSetGenderRules(!genderRulesEnabled)}
              className={`h-8 w-14 rounded-full shrink-0 transition-colors duration-200 relative ${
                genderRulesEnabled ? 'bg-court' : 'bg-line'
              }`}
            >
              <span
                className={`absolute top-1 h-6 w-6 rounded-full bg-white shadow-sm transition-transform duration-200 ${
                  genderRulesEnabled ? 'translate-x-7' : 'translate-x-1'
                }`}
              />
            </button>
          </Card>
        )}
      </div>
    </ScreenLayout>
  );
}
