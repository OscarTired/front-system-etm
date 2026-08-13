import { CalendarDay } from './calendar-day'
import type { CalendarDay as CalendarDayModel } from '../types/types'
import { WEEKDAY_LABELS } from '../utils/dates'

export interface CalendarGridProps {
  weeks: CalendarDayModel[][]
  onSelectDay: (date: Date) => void
}

export function CalendarGrid({ weeks, onSelectDay }: CalendarGridProps): React.JSX.Element {
  return (
    <div>
      <div className="grid grid-cols-7 mb-1">
        {WEEKDAY_LABELS.map((label, index) => (
          <div
            key={`${label}-${index}`}
            className="flex items-center justify-center w-8 h-6 text-[11px] font-semibold text-muted-foreground/80"
          >
            {label}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-y-1">
        {weeks.map((week, weekIndex) =>
          week.map((day) => (
            <CalendarDay
              key={`${weekIndex}-${day.date.toISOString()}`}
              day={day}
              onSelect={onSelectDay}
            />
          )),
        )}
      </div>
    </div>
  )
}