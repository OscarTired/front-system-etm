import { toISODateString } from "@/shared/ui/date-picker/utils/date-format"

/** Lunes de la semana que contiene `date` (local). */
export function startOfWeekMonday(date: Date): Date {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 12)
  const day = d.getDay() // 0=dom … 6=sáb
  const diff = day === 0 ? -6 : 1 - day
  d.setDate(d.getDate() + diff)
  return d
}

export function addDays(date: Date, days: number): Date {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 12)
  d.setDate(d.getDate() + days)
  return d
}

export function getWeekDays(anchor: Date): Date[] {
  const start = startOfWeekMonday(anchor)
  return Array.from({ length: 7 }, (_, i) => addDays(start, i))
}

export function getWeekRangeISO(anchor: Date): { from: string; to: string } {
  const days = getWeekDays(anchor)
  return {
    from: toISODateString(days[0]),
    to: toISODateString(days[6]),
  }
}

export function startOfDayISO(dateISO: string): string {
  return new Date(`${dateISO}T00:00:00`).toISOString()
}

export function endOfDayISO(dateISO: string): string {
  return new Date(`${dateISO}T23:59:59`).toISOString()
}

/** Primer día del mes (local, mediodía). */
export function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1, 12)
}

/** Último día del mes (local, mediodía). */
export function endOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0, 12)
}

/**
 * Matriz del mes (semanas de lun–dom).
 * Incluye días del mes anterior/siguiente para completar el grid.
 */
export function getMonthGrid(anchor: Date): Date[] {
  const first = startOfMonth(anchor)
  const gridStart = startOfWeekMonday(first)
  // 6 semanas fijas = 42 celdas (cubre cualquier mes)
  return Array.from({ length: 42 }, (_, i) => addDays(gridStart, i))
}

export function getMonthRangeISO(anchor: Date): { from: string; to: string } {
  return {
    from: toISODateString(startOfMonth(anchor)),
    to: toISODateString(endOfMonth(anchor)),
  }
}