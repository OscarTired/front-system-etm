import { useRef } from 'react';
import { CalendarGrid } from './calendar-grid';
import { CalendarHeader } from './calendar-header';
import { useCalendar } from '../hooks/use-calendar';
import { getToday } from '../utils/dates';
import { cn } from '@/shared/utils/utils';

export interface DateCalendarProps {
  value?: Date | null;
  minDate?: Date;
  maxDate?: Date;
  onSelect: (date: Date) => void;
  displayDate?: Date | null;
  className?: string;
}

export function DateCalendar({
  value,
  minDate,
  maxDate,
  onSelect,
  displayDate,
  className,
}: DateCalendarProps): React.JSX.Element {
  const {
    weeks,
    monthYearLabel,
    goToPreviousMonth,
    goToNextMonth,
    goToPreviousYear,
    goToNextYear,
    setViewDate,
  } = useCalendar({ value: displayDate || value, minDate, maxDate });

  const touchStartX = useRef<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;

    const touchEndX = e.changedTouches[0].clientX;
    const diffX = touchStartX.current - touchEndX;

    if (Math.abs(diffX) > 40) {
      if (diffX > 0) {
        goToNextMonth();
      } else {
        goToPreviousMonth();
      }
    }

    touchStartX.current = null;
  };

  const handleTodayClick = () => {
    const today = getToday();
    setViewDate(today);
    onSelect(today);
  };

  return (
    <div
      className={cn(
        "w-full max-w-xs mx-auto p-3 select-none touch-pan-y flex flex-col gap-2",
        className
      )}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <CalendarHeader
        label={monthYearLabel}
        onPreviousMonth={goToPreviousMonth}
        onNextMonth={goToNextMonth}
        onPreviousYear={goToPreviousYear}
        onNextYear={goToNextYear}
      />

      <CalendarGrid weeks={weeks} onSelectDay={onSelect} />

      <div className="pt-2 border-t border-white/10 flex justify-center">
        <button
          type="button"
          onClick={handleTodayClick}
          className="px-3 py-1 text-xs font-medium text-blue-400 hover:text-blue-300 hover:bg-white/5 rounded-md transition-colors"
        >
          Hoy
        </button>
      </div>
    </div>
  );
}