import { useCallback, useEffect, useMemo, useState } from 'react'
import type { UseCalendarOptions, UseCalendarReturn } from '../types/types'
import { buildCalendarMatrix } from '../utils/calendar'
import { addMonths, addYears, getMonthLabel, getToday } from '../utils/dates'

export function useCalendar({
  value,
  minDate,
  maxDate,
  markedDates,
}: UseCalendarOptions): UseCalendarReturn {
  const [viewDate, setViewDateState] = useState<Date>(() => value ?? getToday())

  useEffect(() => {
    if (value) {
      setViewDateState(value)
    }
  }, [value])

  const weeks = useMemo(
    () => buildCalendarMatrix(viewDate, value ?? null, minDate, maxDate, markedDates),
    [viewDate, value, minDate, maxDate, markedDates],
  )

  const monthYearLabel = useMemo(
    () => `${getMonthLabel(viewDate)} ${viewDate.getFullYear()}`,
    [viewDate],
  )

  const setViewDate = useCallback((date: Date) => {
    setViewDateState(date)
  }, [])

  const goToPreviousMonth = useCallback(() => {
    setViewDateState((current) => addMonths(current, -1))
  }, [])

  const goToNextMonth = useCallback(() => {
    setViewDateState((current) => addMonths(current, 1))
  }, [])

  const goToPreviousYear = useCallback(() => {
    setViewDateState((current) => addYears(current, -1))
  }, [])

  const goToNextYear = useCallback(() => {
    setViewDateState((current) => addYears(current, 1))
  }, [])

  return {
    viewDate,
    weeks,
    monthYearLabel,
    goToPreviousMonth,
    goToNextMonth,
    goToPreviousYear,
    goToNextYear,
    setViewDate,
  }
}