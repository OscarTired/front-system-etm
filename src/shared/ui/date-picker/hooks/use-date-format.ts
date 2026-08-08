import { useCallback, useEffect, useState } from 'react';
import type { UseDateFormatOptions, UseDateFormatReturn } from '../types/types';
import { isDateDisabled } from '../utils/dates';
import { formatDate, parseDateString, sanitizeDateInput } from '../utils/format';

/**
 * Sincroniza el texto del input con el `Date` externo, valida al confirmar
 * (blur / Enter) y revierte si el texto no es una fecha válida o permitida.
 * Única responsabilidad: puente entre texto libre y el modelo `Date`.
 */
export function useDateFormat({
  value,
  minDate,
  maxDate,
  onCommit,
}: UseDateFormatOptions): UseDateFormatReturn {
  const [inputValue, setInputValue] = useState<string>(value ? formatDate(value) : '');

  useEffect(() => {
    setInputValue(value ? formatDate(value) : '');
  }, [value]);

  const syncFromExternalValue = useCallback((date: Date | null) => {
    setInputValue(date ? formatDate(date) : '');
  }, []);

  const handleInputChange = useCallback((raw: string) => {
    setInputValue(sanitizeDateInput(raw));
  }, []);

  const commit = useCallback(() => {
    if (inputValue.trim() === '') {
      onCommit(null);
      return;
    }

    const parsed = parseDateString(inputValue);
    if (!parsed || isDateDisabled(parsed, minDate, maxDate)) {
      setInputValue(value ? formatDate(value) : '');
      return;
    }

    onCommit(parsed);
    setInputValue(formatDate(parsed));
  }, [inputValue, minDate, maxDate, onCommit, value]);

  const handleInputBlur = useCallback(() => {
    commit();
  }, [commit]);

  const handleInputKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLInputElement>) => {
      if (event.key === 'Enter') {
        event.preventDefault();
        commit();
      }
    },
    [commit],
  );

  /**
   * Selecciona todo al enfocar para poder reemplazar la fecha entera
   * escribiendo de cero. La edición parcial de un segmento (solo día/mes)
   * se resuelve en sanitizeDateInput respetando las "/".
   */
  const handleInputFocus = useCallback((event: React.FocusEvent<HTMLInputElement>) => {
    const el = event.currentTarget;
    requestAnimationFrame(() => {
      el.select();
    });
  }, []);

  return {
    inputValue,
    handleInputChange,
    handleInputBlur,
    handleInputKeyDown,
    handleInputFocus,
    syncFromExternalValue,
  };
}