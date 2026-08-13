import { forwardRef } from 'react';

/**
 * Input de texto puro para el código hex, con prefijo "#" fijo.
 * Única responsabilidad: presentación + eventos del campo de texto.
 */
export interface HexInputProps {
  value: string;
  disabled?: boolean;
  onChange: (raw: string) => void;
  onBlur: () => void;
  onKeyDown: (event: React.KeyboardEvent<HTMLInputElement>) => void;
}

export const HexInput = forwardRef<HTMLInputElement, HexInputProps>(
  ({ value, disabled, onChange, onBlur, onKeyDown }, ref) => {
    return (
      <div
        className={[
          'flex items-center h-10 px-4 rounded-xl text-sm font-medium gap-0.5',
          'bg-foreground/5 border border-transparent',
          'transition-colors',
        ].join(' ')}
      >
        <span className="text-muted-foreground/80 font-mono">#</span>
        <input
          ref={ref}
          type="text"
          autoComplete="off"
          spellCheck={false}
          value={value}
          disabled={disabled}
          maxLength={6}
          onChange={(event) => onChange(event.target.value)}
          onBlur={onBlur}
          onKeyDown={onKeyDown}
          className={[
            'w-full bg-transparent outline-none font-mono uppercase text-foreground',
            'disabled:opacity-50 disabled:cursor-not-allowed',
          ].join(' ')}
        />
      </div>
    );
  },
);

HexInput.displayName = 'HexInput';