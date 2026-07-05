import type { ReactNode } from 'react';
import { ChevronLeft } from 'lucide-react';
import { ProgressSteps } from './ProgressSteps';

interface ScreenLayoutProps {
  title?: string;
  onBack?: () => void;
  progress?: { total: number; current: number };
  children: ReactNode;
  footer?: ReactNode;
}

/** The shared shell for every wizard/game screen: header, scroll area, sticky action footer. */
export function ScreenLayout({ title, onBack, progress, children, footer }: ScreenLayoutProps) {
  return (
    <div className="min-h-dvh flex flex-col max-w-md mx-auto w-full">
      <header className="sticky top-0 z-10 bg-mist/95 backdrop-blur-sm px-4 pt-[max(env(safe-area-inset-top),1rem)] pb-3 flex items-center gap-2">
        {onBack && (
          <button
            onClick={onBack}
            aria-label="Назад"
            className="h-11 w-11 -ml-2 shrink-0 flex items-center justify-center rounded-full active:bg-black/5 text-ink transition-colors"
          >
            <ChevronLeft size={22} />
          </button>
        )}
        {progress ? (
          <div className="flex-1">
            <ProgressSteps total={progress.total} current={progress.current} />
          </div>
        ) : title ? (
          <h1 className="flex-1 font-display font-extrabold text-lg text-ink truncate">{title}</h1>
        ) : (
          <div className="flex-1" />
        )}
        {onBack && <div className="w-11 shrink-0" aria-hidden="true" />}
      </header>

      <main className="flex-1 px-4 pb-6 overflow-y-auto">{children}</main>

      {footer && (
        <footer className="sticky bottom-0 bg-gradient-to-t from-mist via-mist to-transparent pt-8 px-4 pb-[max(env(safe-area-inset-bottom),1rem)]">
          {footer}
        </footer>
      )}
    </div>
  );
}
