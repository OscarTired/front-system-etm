import type { CalendarDay } from '../types/types';
import {
  addDays,
  getDaysInMonth,
  getISOWeekday,
  getToday,
  isDateDisabled,
  isSameDay,
  startOfMonth,
} from './dates';

const WEEKS_IN_GRID = 6;
const DAYS_IN_WEEK = 7;
const TOTAL_CELLS = WEEKS_IN_GRID * DAYS_IN_WEEK;

/**
 * Construye la matriz de 6 semanas x 7 días para el mes visible,
 * incluyendo días de relleno del mes anterior/siguiente.
 * Única responsabilidad: derivar la grilla a partir de un mes de referencia.
 */
export function buildCalendarMatrix(
  viewDate: Date,
  selected: Date | null,
  minDate?: Date,
  maxDate?: Date,
): CalendarDay[][] {
  const firstOfMonth = startOfMonth(viewDate);
  const leadingOffset = getISOWeekday(firstOfMonth);
  const gridStart = addDays(firstOfMonth, -leadingOffset);
  const today = getToday();

  const days: CalendarDay[] = [];
  for (let i = 0; i < TOTAL_CELLS; i += 1) {
    const date = addDays(gridStart, i);
    const inViewMonth = date.getMonth() === viewDate.getMonth();
    days.push({
      date,
      isCurrentMonth: inViewMonth,
      isToday: isSameDay(date, today),
      // Solo pintar selección si el día pertenece al mes visible.
      // Evita que el 8 de agosto se vea "elegido" al navegar a julio
      // (donde el 8 de ago aparece como celda del mes siguiente).
      isSelected: selected
        ? isSameDay(date, selected) && inViewMonth
        : false,
      isDisabled: isDateDisabled(date, minDate, maxDate),
    });
  }

  const weeks: CalendarDay[][] = [];
  for (let w = 0; w < WEEKS_IN_GRID; w += 1) {
    weeks.push(days.slice(w * DAYS_IN_WEEK, w * DAYS_IN_WEEK + DAYS_IN_WEEK));
  }

  return weeks;
}

export function getDaysCountInMonth(date: Date): number {
  return getDaysInMonth(date);
}