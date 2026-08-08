import type { CalendarDay, DayMarker } from '../types/types'
import {
  addDays,
  getDaysInMonth,
  getISOWeekday,
  getToday,
  isDateDisabled,
  isSameDay,
  startOfMonth,
} from './dates'
import { toISODateString } from './date-format'

const WEEKS_IN_GRID = 6
const DAYS_IN_WEEK = 7
const TOTAL_CELLS = WEEKS_IN_GRID * DAYS_IN_WEEK

export function buildCalendarMatrix(
  viewDate: Date,
  selected: Date | null,
  minDate?: Date,
  maxDate?: Date,
  markedDates?: Record<string, DayMarker[]>,
): CalendarDay[][] {
  const firstOfMonth = startOfMonth(viewDate)
  const leadingOffset = getISOWeekday(firstOfMonth)
  const gridStart = addDays(firstOfMonth, -leadingOffset)
  const today = getToday()

  const days: CalendarDay[] = []
  for (let i = 0; i < TOTAL_CELLS; i += 1) {
    const date = addDays(gridStart, i)
    const key = toISODateString(date)
    days.push({
      date,
      isCurrentMonth: date.getMonth() === viewDate.getMonth(),
      isToday: isSameDay(date, today),
      isSelected: selected ? isSameDay(date, selected) : false,
      isDisabled: isDateDisabled(date, minDate, maxDate),
      markers: markedDates?.[key],
    })
  }

  const weeks: CalendarDay[][] = []
  for (let w = 0; w < WEEKS_IN_GRID; w += 1) {
    weeks.push(days.slice(w * DAYS_IN_WEEK, w * DAYS_IN_WEEK + DAYS_IN_WEEK))
  }

  return weeks
}

export function getDaysCountInMonth(date: Date): number {
  return getDaysInMonth(date)
}