import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

/**
 * Header del calendario: etiqueta mes/año + navegación.
 * Única responsabilidad: presentación de controles de navegación.
 */
export interface CalendarHeaderProps {
  label: string;
  onPreviousMonth: () => void;
  onNextMonth: () => void;
  onPreviousYear: () => void;
  onNextYear: () => void;
}

const navButtonClasses = [
  'flex items-center justify-center w-6 h-6 rounded-lg',
  'text-muted-foreground hover:text-foreground hover:bg-foreground/10',
  'transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-border',
].join(' ');

export function CalendarHeader({
  label,
  onPreviousMonth,
  onNextMonth,
  onPreviousYear,
  onNextYear,
}: CalendarHeaderProps): React.JSX.Element {
  return (
    <div className="flex items-center justify-between px-1 pb-2">
      <div className="flex items-center gap-0.5">
        <button
          type="button"
          aria-label="Año anterior"
          className={navButtonClasses}
          onClick={onPreviousYear}
        >
          <ChevronsLeft size={14} strokeWidth={2} />
        </button>
        <button
          type="button"
          aria-label="Mes anterior"
          className={navButtonClasses}
          onClick={onPreviousMonth}
        >
          <ChevronLeft size={14} strokeWidth={2} />
        </button>
      </div>

      <span className="text-xs font-semibold text-foreground select-none">
        {label}
      </span>

      <div className="flex items-center gap-0.5">
        <button
          type="button"
          aria-label="Mes siguiente"
          className={navButtonClasses}
          onClick={onNextMonth}
        >
          <ChevronRight size={14} strokeWidth={2} />
        </button>
        <button
          type="button"
          aria-label="Año siguiente"
          className={navButtonClasses}
          onClick={onNextYear}
        >
          <ChevronsRight size={14} strokeWidth={2} />
        </button>
      </div>
    </div>
  );
}