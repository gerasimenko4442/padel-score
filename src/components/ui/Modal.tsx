import type { MouseEvent, ReactNode } from 'react';

interface ModalProps {
  open: boolean;
  onClose?: () => void;
  children: ReactNode;
}

export function Modal({ open, onClose, children }: ModalProps) {
  if (!open) return null;

  const stop = (e: MouseEvent) => e.stopPropagation();

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-ink/40 backdrop-blur-[2px] p-4 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="w-full sm:max-w-sm bg-white rounded-3xl shadow-soft p-6 animate-slide-up"
        onClick={stop}
        role="dialog"
        aria-modal="true"
      >
        {children}
      </div>
    </div>
  );
}
