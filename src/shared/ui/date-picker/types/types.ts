/**
 * Tipos públicos e internos del Date Picker.
 * Única responsabilidad: definición de contratos (props, modelos de datos).
 */

export interface DatePickerProps {
  /** Fecha seleccionada (controlado). `null`/`undefined` = sin selección. */
  value?: Date | null;
  /** Notifica el cambio de selección. */
  onChange: (date: Date | null) => void;
  /** Texto mostrado cuando no hay valor. */
  placeholder?: string;
  /** Deshabilita input y apertura del calendario. */
  disabled?: boolean;
  /** Fecha mínima seleccionable (inclusive). */
  minDate?: Date;
  /** Fecha máxima seleccionable (inclusive). */
  maxDate?: Date;
  /** Clases adicionales para el contenedor raíz. */
  className?: string;
}

export interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
  isDisabled: boolean;
}

export interface UseCalendarOptions {
  value?: Date | null;
  /** Fecha opcional para forzar la vista del mes durante el tipeo */
  displayDate?: Date | null;
  minDate?: Date;
  maxDate?: Date;
}

export interface UseCalendarReturn {
  /** Mes actualmente visible en el grid (día 1 de ese mes). */
  viewDate: Date;
  /** Matriz de semanas (6 semanas x 7 días) lista para renderizar. */
  weeks: CalendarDay[][];
  /** Etiqueta "Julio 2026" para el header. */
  monthYearLabel: string;
  goToPreviousMonth: () => void;
  goToNextMonth: () => void;
  goToPreviousYear: () => void;
  goToNextYear: () => void;
  /** Cambia la fecha visible activa en el calendario */
  setViewDate: (date: Date) => void;
}

export interface UseDateFormatOptions {
  value?: Date | null;
  minDate?: Date;
  maxDate?: Date;
  onCommit: (date: Date | null) => void;
}

export interface UseDateFormatReturn {
  inputValue: string;
  handleInputChange: (raw: string) => void;
  handleInputBlur: () => void;
  handleInputKeyDown: (event: React.KeyboardEvent<HTMLInputElement>) => void;
  handleInputFocus: (event: React.FocusEvent<HTMLInputElement>) => void;
  syncFromExternalValue: (date: Date | null) => void;
}

export interface DateInputProps {
  value: string;
  placeholder?: string;
  disabled?: boolean;
  readOnly?: boolean;
  className?: string;
  hideCalendarIcon?: boolean;
  onChange: (raw: string) => void;
  onBlur: () => void;
  onKeyDown: (event: React.KeyboardEvent<HTMLInputElement>) => void;
  onFocus?: (event: React.FocusEvent<HTMLInputElement>) => void;
  onClick?: (event: React.MouseEvent<HTMLInputElement>) => void;
  onCalendarClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
}