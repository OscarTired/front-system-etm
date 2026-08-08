import type { CalendarDay as CalendarDayModel } from '../types/types'

export interface CalendarDayProps {
  day: CalendarDayModel
  onSelect: (date: Date) => void
}

export function CalendarDay({ day, onSelect }: CalendarDayProps): React.JSX.Element {
  const { date, isCurrentMonth, isToday, isSelected, isDisabled, markers } = day
  const hasMarkers = !!markers && markers.length > 0

  return (
    <button
      type="button"
      disabled={isDisabled}
      onClick={() => onSelect(date)}
      aria-pressed={isSelected}
      aria-current={isToday ? 'date' : undefined}
      className={[
        'relative flex items-center justify-center w-8 h-8 rounded-lg text-xs font-medium',
        'transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white/15',
        !isCurrentMonth ? 'text-neutral-700' : 'text-neutral-300',
        !isDisabled && !isSelected ? 'hover:bg-white/8' : '',
        isSelected
          ? 'bg-white text-neutral-900 hover:bg-white font-semibold'
          : '',
        isDisabled ? 'opacity-30 cursor-not-allowed hover:bg-transparent' : 'cursor-pointer',
      ].join(' ')}
    >
      <span className="relative z-10">{date.getDate()}</span>

      {isToday && !isSelected && !hasMarkers ? (
        <span className="pointer-events-none absolute bottom-1 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-white" />
      ) : null}

      {hasMarkers ? (
        <span className="pointer-events-none absolute bottom-0.5 left-1/2 flex -translate-x-1/2 items-center justify-center gap-0.5">
          {markers!.slice(0, 3).map((m, i) => (
            <span
              key={i}
              className="h-1 w-1 rounded-full"
              style={{
                backgroundColor: m.color,
                boxShadow: isSelected ? '0 0 0 1px rgba(0,0,0,0.35)' : undefined,
              }}
            />
          ))}
        </span>
      ) : null}

      {isToday && !isSelected && hasMarkers ? (
        <span className="pointer-events-none absolute inset-0 rounded-lg ring-1 ring-white/40" />
      ) : null}
    </button>
  )
}