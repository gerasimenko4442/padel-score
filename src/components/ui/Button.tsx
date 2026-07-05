import type { ButtonHTMLAttributes, ReactNode } from 'react';

type Variant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
type Size = 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  fullWidth?: boolean;
  icon?: ReactNode;
}

const VARIANT_CLASSES: Record<Variant, string> = {
  primary: 'bg-court text-white shadow-pop active:bg-court-dark disabled:bg-line disabled:text-ink-muted disabled:shadow-none',
  secondary: 'bg-white text-ink border border-line active:bg-mist',
  outline: 'bg-transparent text-court border-2 border-court active:bg-court-light',
  ghost: 'bg-transparent text-ink-muted active:bg-black/5 disabled:opacity-40',
  danger: 'bg-loss text-white active:bg-red-700',
};

// 48px is the spec's minimum tap target; `md` sits right at that floor.
const SIZE_CLASSES: Record<Size, string> = {
  md: 'h-12 px-4 text-[15px] rounded-xl gap-2',
  lg: 'h-14 px-6 text-base rounded-2xl gap-2.5',
};

export function Button({
  variant = 'primary',
  size = 'lg',
  fullWidth = false,
  icon,
  className = '',
  children,
  disabled,
  ...rest
}: ButtonProps) {
  return (
    <button
      disabled={disabled}
      className={`inline-flex items-center justify-center font-display font-bold transition-all duration-200 active:scale-[0.98] disabled:cursor-not-allowed disabled:active:scale-100 ${VARIANT_CLASSES[variant]} ${SIZE_CLASSES[size]} ${fullWidth ? 'w-full' : ''} ${className}`}
      {...rest}
    >
      {icon}
      {children}
    </button>
  );
}
