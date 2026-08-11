/**
 * Tipos públicos e internos del Date Picker.
 */

export interface DayMarker {
  color: string
}

export interface DatePickerProps {
  value?: Date | null
  onChange: (date: Date | null) => void
  placeholder?: string
  disabled?: boolean
  minDate?: Date
  maxDate?: Date
  className?: string
  /** Días con marcadores (yyyy-mm-dd → puntos de color) */
  markedDates?: Record<string, DayMarker[]>
  /** Notifica apertura/cierre del popover (DateNavigator deshabilita flechas) */
  onOpenChange?: (open: boolean) => void
  /** Mes visible en el calendario del popover */
  onViewMonthChange?: (month: Date) => void
  /** Solo botón con icono de calendario (sin input de texto) */
  iconOnly?: boolean
}

export interface CalendarDay {
  date: Date
  isCurrentMonth: boolean
  isToday: boolean
  isSelected: boolean
  isDisabled: boolean
  markers?: DayMarker[]
}

export interface UseCalendarOptions {
  value?: Date | null
  displayDate?: Date | null
  minDate?: Date
  maxDate?: Date
  markedDates?: Record<string, DayMarker[]>
}

export interface UseCalendarReturn {
  viewDate: Date
  weeks: CalendarDay[][]
  monthYearLabel: string
  goToPreviousMonth: () => void
  goToNextMonth: () => void
  goToPreviousYear: () => void
  goToNextYear: () => void
  setViewDate: (date: Date) => void
}

export interface UseDateFormatOptions {
  value?: Date | null
  minDate?: Date
  maxDate?: Date
  onCommit: (date: Date | null) => void
}

export interface UseDateFormatReturn {
  inputValue: string
  handleInputChange: (raw: string) => void
  handleInputBlur: () => void
  handleInputKeyDown: (event: React.KeyboardEvent<HTMLInputElement>) => void
  handleInputFocus: (event: React.FocusEvent<HTMLInputElement>) => void
  syncFromExternalValue: (date: Date | null) => void
}

export interface DateInputProps {
  value: string
  placeholder?: string
  disabled?: boolean
  readOnly?: boolean
  className?: string
  hideCalendarIcon?: boolean
  onChange: (raw: string) => void
  onBlur: () => void
  onKeyDown: (event: React.KeyboardEvent<HTMLInputElement>) => void
  onFocus?: (event: React.FocusEvent<HTMLInputElement>) => void
  onClick?: (event: React.MouseEvent<HTMLInputElement>) => void
  onCalendarClick?: (event: React.MouseEvent<HTMLButtonElement>) => void
}