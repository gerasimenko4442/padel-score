interface ScoreStepperProps {
  value: number;
  onChange: (value: number) => void;
  accentClass?: string;
  disabled?: boolean;
}

/** Big +/- targets plus a direct-entry field, so score entry is fast whether tapping or typing. */
export function ScoreStepper({ value, onChange, accentClass = 'text-ink', disabled = false }: ScoreStepperProps) {
  const dec = () => onChange(Math.max(0, value - 1));
  const inc = () => onChange(value + 1);

  return (
    <div className="flex items-center gap-1.5">
      <button
        type="button"
        onClick={dec}
        disabled={disabled}
        aria-label="Зменшити рахунок"
        className="h-11 w-11 shrink-0 rounded-xl bg-mist active:bg-line disabled:opacity-40 flex items-center justify-center text-ink text-xl font-bold transition-colors"
      >
        −
      </button>
      <input
        type="number"
        inputMode="numeric"
        pattern="[0-9]*"
        value={value}
        disabled={disabled}
        onChange={(e) => {
          const digits = e.target.value.replace(/[^0-9]/g, '');
          onChange(digits === '' ? 0 : Math.min(999, Number(digits)));
        }}
        onFocus={(e) => e.target.select()}
        className={`w-14 min-w-0 h-11 text-center font-display font-extrabold text-2xl tabular-nums bg-transparent focus:outline-none disabled:opacity-60 ${accentClass}`}
      />
      <button
        type="button"
        onClick={inc}
        disabled={disabled}
        aria-label="Збільшити рахунок"
        className="h-11 w-11 shrink-0 rounded-xl bg-mist active:bg-line disabled:opacity-40 flex items-center justify-center text-ink text-xl font-bold transition-colors"
      >
        +
      </button>
    </div>
  );
}
