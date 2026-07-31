"use client";

import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { useCallback, useRef, useState, useMemo } from 'react';
import { DateCalendar } from './date-calendar';
import { DateInput } from './date-input';
import { useDateFormat } from '../hooks/use-date-format';
import { useResponsive } from '@/shared/responsive/hooks/use-responsive';
import type { DatePickerProps } from '../types/types';

function parsePartialDate(input: string): Date | null {
  const clean = input.replace(/[^\d/]/g, '');
  const parts = clean.split('/');

  if (parts.length >= 2) {
    const day = parseInt(parts[0], 10) || 1;
    const month = parseInt(parts[1], 10) - 1;
    let year = parts[2] ? parseInt(parts[2], 10) : new Date().getFullYear();

    if (parts[2] && parts[2].length === 4) {
      year = parseInt(parts[2], 10);
    }

    if (month >= 0 && month <= 11 && year > 1000 && year < 3000) {
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      return new Date(year, month, Math.min(day, daysInMonth));
    }
  }
  return null;
}

export function DatePicker({
  value = null,
  onChange,
  placeholder,
  disabled,
  minDate,
  maxDate,
  className,
}: DatePickerProps): React.JSX.Element {
  const [open, setOpen] = useState(false);
  const { isMobile } = useResponsive();
  const inputRef = useRef<HTMLInputElement>(null);

  const handleCommit = useCallback(
    (date: Date | null) => {
      onChange(date);
    },
    [onChange],
  );

  const {
    inputValue,
    handleInputChange,
    handleInputBlur,
    handleInputKeyDown,
    syncFromExternalValue,
  } = useDateFormat({ value, minDate, maxDate, onCommit: handleCommit });

  const livePreviewDate = useMemo(() => {
    if (!inputValue) return null;
    return parsePartialDate(inputValue);
  }, [inputValue]);

  const handleOpenChange = useCallback((next: boolean) => {
    setOpen(next);
  }, []);

  const handleSelectDay = useCallback(
    (date: Date) => {
      onChange(date);
      syncFromExternalValue(date);
      handleOpenChange(false);
    },
    [onChange, syncFromExternalValue, handleOpenChange],
  );

  const handleKeyDownWithEscape = useCallback(
    (event: React.KeyboardEvent<HTMLInputElement>) => {
      if (event.key === 'Escape') {
        handleOpenChange(false);
        return;
      }
      if (event.key === 'ArrowDown') {
        event.preventDefault();
        setOpen(true);
        return;
      }
      handleInputKeyDown(event);
    },
    [handleInputKeyDown, handleOpenChange],
  );

  // FLUJO DESKTOP: Clic en el input abre popover y mantiene el foco para escribir
  const handleInputClickDesktop = useCallback(() => {
    if (!isMobile) {
      setOpen(true);
    }
  }, [isMobile]);

  // BARRERA O BOTÓN DE CALENDARIO: Funciona en ambas plataformas
  const handleCalendarIconClick = useCallback((event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    setOpen((prev) => !prev);
  }, []);

  return (
    <Popover open={open} onOpenChange={disabled ? undefined : handleOpenChange}>
      <PopoverTrigger asChild>
        <div className={className}>
          <DateInput
            ref={inputRef}
            value={inputValue}
            placeholder={placeholder}
            disabled={disabled}
            readOnly={isMobile}
            onChange={handleInputChange}
            onBlur={handleInputBlur}
            onKeyDown={handleKeyDownWithEscape}
            onClick={handleInputClickDesktop}
            onCalendarClick={handleCalendarIconClick}
          />
        </div>
      </PopoverTrigger>

      <PopoverContent
        sideOffset={6}
        // En Desktop no permitimos que el popover robe el foco inicial del input
        onOpenAutoFocus={(e) => {
          if (!isMobile) e.preventDefault();
        }}
        className={isMobile ? undefined : "w-auto p-0 rounded-xl shadow-xl bg-popover"}
      >
        <DateCalendar
          value={value}
          displayDate={livePreviewDate}
          minDate={minDate}
          maxDate={maxDate}
          onSelect={handleSelectDay}
        />
      </PopoverContent>
    </Popover>
  );
}