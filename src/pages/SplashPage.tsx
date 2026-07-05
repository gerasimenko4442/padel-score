import { useState } from 'react';
import { Play, RotateCcw } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';

function HeroCourt() {
  return (
    <svg viewBox="0 0 320 200" className="w-full max-w-[280px] mx-auto">
      <rect x="10" y="10" width="300" height="180" rx="16" fill="var(--color-court-light)" />
      <rect x="26" y="26" width="268" height="148" rx="8" fill="none" stroke="var(--color-court)" strokeOpacity="0.4" strokeWidth="3" />
      <line x1="160" y1="26" x2="160" y2="174" stroke="var(--color-court)" strokeOpacity="0.65" strokeWidth="4" />
      <line x1="90" y1="26" x2="90" y2="174" stroke="var(--color-court)" strokeOpacity="0.3" strokeWidth="2" />
      <line x1="230" y1="26" x2="230" y2="174" stroke="var(--color-court)" strokeOpacity="0.3" strokeWidth="2" />
      <line x1="90" y1="100" x2="130" y2="100" stroke="var(--color-court)" strokeOpacity="0.3" strokeWidth="2" />
      <line x1="190" y1="100" x2="230" y2="100" stroke="var(--color-court)" strokeOpacity="0.3" strokeWidth="2" />
      <circle cx="60" cy="60" r="9" fill="var(--color-info)" opacity="0.85" />
      <circle cx="60" cy="140" r="9" fill="var(--color-accent)" opacity="0.85" />
      <circle cx="260" cy="60" r="9" fill="var(--color-info)" opacity="0.85" />
      <circle cx="260" cy="140" r="9" fill="var(--color-accent)" opacity="0.85" />
    </svg>
  );
}

interface SplashPageProps {
  resumeAvailable: boolean;
  onResume: () => void;
  onDiscardResume: () => void;
  onStartNew: () => void;
}

export function SplashPage({ resumeAvailable, onResume, onDiscardResume, onStartNew }: SplashPageProps) {
  const [promptOpen, setPromptOpen] = useState(resumeAvailable);

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center px-6 max-w-md mx-auto w-full text-center">
      <HeroCourt />
      <h1 className="font-display font-extrabold text-4xl text-ink mt-6">Padel Score</h1>
      <p className="text-ink-muted mt-2 max-w-[32ch]">
        Справедливий і автоматичний розподіл гравців для вашого падел-турніру
      </p>

      <div className="w-full mt-10">
        <Button size="lg" fullWidth icon={<Play size={20} fill="currentColor" />} onClick={onStartNew}>
          Нова гра
        </Button>
        {resumeAvailable && (
          <button
            type="button"
            onClick={() => setPromptOpen(true)}
            className="mt-4 inline-flex items-center gap-1.5 text-court-dark font-semibold text-sm active:opacity-70"
          >
            <RotateCcw size={15} />
            Продовжити попередню гру
          </button>
        )}
      </div>

      <Modal open={promptOpen}>
        <p className="font-display font-extrabold text-lg text-ink mb-1.5">Продовжити попередню гру?</p>
        <p className="text-sm text-ink-muted leading-relaxed mb-5">
          Ми знайшли збережену гру, яку ви не завершили. Продовжити з того ж місця, чи почати нову?
        </p>
        <div className="flex gap-3">
          <Button
            variant="secondary"
            size="md"
            fullWidth
            onClick={() => {
              setPromptOpen(false);
              onDiscardResume();
            }}
          >
            Нова гра
          </Button>
          <Button
            size="md"
            fullWidth
            onClick={() => {
              setPromptOpen(false);
              onResume();
            }}
          >
            Продовжити
          </Button>
        </div>
      </Modal>
    </div>
  );
}
