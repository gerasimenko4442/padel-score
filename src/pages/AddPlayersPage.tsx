import { ArrowRight, Users } from 'lucide-react';
import type { Gender, Player } from '../types';
import { MIN_PLAYERS } from '../types';
import { ScreenLayout } from '../components/ui/ScreenLayout';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { InlineAlert } from '../components/ui/InlineAlert';
import { EmptyState } from '../components/ui/EmptyState';
import { PlayerForm } from '../components/PlayerForm';
import { PlayerListItem } from '../components/PlayerListItem';

interface AddPlayersPageProps {
  players: Player[];
  error: string | null;
  onClearError: () => void;
  onAdd: (name: string, gender: Gender) => boolean;
  onRemove: (id: string) => void;
  onBack: () => void;
  onNext: () => void;
}

export function AddPlayersPage({ players, error, onClearError, onAdd, onRemove, onBack, onNext }: AddPlayersPageProps) {
  const canContinue = players.length >= MIN_PLAYERS;
  const male = players.filter((p) => p.gender === 'male').length;
  const female = players.length - male;

  return (
    <ScreenLayout
      onBack={onBack}
      progress={{ total: 6, current: 1 }}
      footer={
        <div className="space-y-2">
          {!canContinue && (
            <p className="text-center text-xs text-ink-muted">Додайте ще {MIN_PLAYERS - players.length} гравці, щоб продовжити</p>
          )}
          <Button fullWidth disabled={!canContinue} icon={<ArrowRight size={20} />} onClick={onNext}>
            Продовжити ({players.length})
          </Button>
        </div>
      }
    >
      <div className="pt-6 space-y-4">
        <div>
          <p className="font-display font-extrabold text-2xl text-ink mb-1">Гравці</p>
          <p className="text-ink-muted text-sm">
            {players.length} {players.length === 1 ? 'гравець' : 'гравців'}
            {players.length > 0 && ` · ${male} Ч / ${female} Ж`}
          </p>
        </div>

        {error && <InlineAlert onDismiss={onClearError}>{error}</InlineAlert>}

        <PlayerForm onAdd={onAdd} />

        {players.length === 0 ? (
          <EmptyState
            icon={<Users size={40} />}
            title="Ще немає гравців"
            description="Додайте щонайменше 4 гравці, щоб почати гру"
          />
        ) : (
          <Card className="px-3 py-1">
            {players.map((p) => (
              <PlayerListItem key={p.id} player={p} onRemove={onRemove} />
            ))}
          </Card>
        )}
      </div>
    </ScreenLayout>
  );
}
