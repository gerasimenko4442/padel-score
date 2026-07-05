import { useState } from 'react';
import type { FormEvent } from 'react';
import { UserPlus } from 'lucide-react';
import type { Gender } from '../types';
import { Card } from './ui/Card';
import { Button } from './ui/Button';

interface PlayerFormProps {
  onAdd: (name: string, gender: Gender) => boolean;
}

export function PlayerForm({ onAdd }: PlayerFormProps) {
  const [name, setName] = useState('');
  const [gender, setGender] = useState<Gender>('male');

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    const ok = onAdd(name, gender);
    if (ok) setName('');
  };

  return (
    <Card className="p-3">
      <form onSubmit={submit} className="flex items-center gap-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ім'я гравця"
          maxLength={30}
          className="flex-1 min-w-0 h-12 px-3.5 rounded-xl bg-mist text-[15px] font-medium text-ink focus:outline-none focus:ring-2 focus:ring-court placeholder:text-ink-muted/60"
        />
        <div className="flex rounded-xl bg-mist p-1 shrink-0">
          <button
            type="button"
            onClick={() => setGender('male')}
            aria-pressed={gender === 'male'}
            className={`h-10 w-10 rounded-lg flex items-center justify-center transition-colors ${
              gender === 'male' ? 'bg-info text-white shadow-sm' : 'text-ink-muted'
            }`}
          >
            <span className="font-display font-bold text-sm">Ч</span>
          </button>
          <button
            type="button"
            onClick={() => setGender('female')}
            aria-pressed={gender === 'female'}
            className={`h-10 w-10 rounded-lg flex items-center justify-center transition-colors ${
              gender === 'female' ? 'bg-accent text-white shadow-sm' : 'text-ink-muted'
            }`}
          >
            <span className="font-display font-bold text-sm">Ж</span>
          </button>
        </div>
        <Button type="submit" size="md" className="!px-0 !w-12" aria-label="Додати гравця">
          <UserPlus size={20} />
        </Button>
      </form>
    </Card>
  );
}
