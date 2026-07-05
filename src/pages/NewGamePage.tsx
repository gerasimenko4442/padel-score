import { useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { ScreenLayout } from '../components/ui/ScreenLayout';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';

interface NewGamePageProps {
  onBack: () => void;
  onCreate: (name: string) => void;
}

export function NewGamePage({ onBack, onCreate }: NewGamePageProps) {
  const [name, setName] = useState('');
  const today = new Date().toLocaleDateString('uk-UA', { day: 'numeric', month: 'long' });

  return (
    <ScreenLayout
      onBack={onBack}
      progress={{ total: 6, current: 0 }}
      footer={
        <Button fullWidth icon={<ArrowRight size={20} />} onClick={() => onCreate(name.trim() || `Гра ${today}`)}>
          Продовжити
        </Button>
      }
    >
      <div className="pt-6">
        <p className="font-display font-extrabold text-2xl text-ink mb-1">Нова гра</p>
        <p className="text-ink-muted text-sm mb-6">Дайте назву цій грі, щоб легше знайти її у звіті</p>

        <Card className="p-4">
          <label className="block text-xs font-bold text-ink-muted uppercase tracking-wide mb-2">Назва гри</label>
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={`Гра ${today}`}
            maxLength={40}
            className="w-full h-12 text-lg font-semibold text-ink bg-transparent focus:outline-none placeholder:text-ink-muted/50"
          />
        </Card>
      </div>
    </ScreenLayout>
  );
}
