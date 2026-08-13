"use client"

import { Calendar } from "lucide-react"
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover"
import { useCallback, useRef, useState, useMemo, useEffect } from "react"
import { DateCalendar } from "./date-calendar"
import { DateInput } from "./date-input"
import { useDateFormat } from "../hooks/use-date-format"
import { useResponsive } from "@/shared/responsive/hooks/use-responsive"
import type { DatePickerProps } from "../types/types"

function parsePartialDate(input: string): Date | null {
  const clean = input.replace(/[^\d/]/g, "")
  const parts = clean.split("/")

  if (parts.length >= 2) {
    const day = parseInt(parts[0], 10) || 1
    const month = parseInt(parts[1], 10) - 1
    let year = parts[2] ? parseInt(parts[2], 10) : new Date().getFullYear()

    if (parts[2] && parts[2].length === 4) {
      year = parseInt(parts[2], 10)
    }

    if (month >= 0 && month <= 11 && year > 1000 && year < 3000) {
      const daysInMonth = new Date(year, month + 1, 0).getDate()
      return new Date(year, month, Math.min(day, daysInMonth))
    }
  }
  return null
}

export function DatePicker({
  value = null,
  onChange,
  placeholder,
  disabled,
  minDate,
  maxDate,
  className,
  markedDates,
  onOpenChange: onOpenChangeProp,
  onViewMonthChange,
  iconOnly = false,
}: DatePickerProps): React.JSX.Element {
  const [open, setOpen] = useState(false)
  const { isMobile } = useResponsive()
  const inputRef = useRef<HTMLInputElement>(null)
  const sheetInputRef = useRef<HTMLInputElement>(null)

  const handleCommit = useCallback(
    (date: Date | null) => {
      onChange(date)
    },
    [onChange],
  )

  const {
    inputValue,
    handleInputChange,
    handleInputBlur,
    handleInputKeyDown,
    handleInputFocus,
    syncFromExternalValue,
  } = useDateFormat({ value, minDate, maxDate, onCommit: handleCommit })

  const livePreviewDate = useMemo(() => {
    if (!inputValue) return null
    return parsePartialDate(inputValue)
  }, [inputValue])

  const handleOpenChange = useCallback(
    (next: boolean) => {
      setOpen(next)
      onOpenChangeProp?.(next)
    },
    [onOpenChangeProp],
  )

  useEffect(() => {
    if (open && isMobile) {
      if (document.activeElement instanceof HTMLElement) {
        document.activeElement.blur()
      }
    }
  }, [open, isMobile])

  const handleSelectDay = useCallback(
    (date: Date) => {
      onChange(date)
      syncFromExternalValue(date)
      handleOpenChange(false)
    },
    [onChange, syncFromExternalValue, handleOpenChange],
  )

  const handleKeyDownWithEscape = useCallback(
    (event: React.KeyboardEvent<HTMLInputElement>) => {
      if (event.key === "Escape") {
        handleOpenChange(false)
        return
      }
      if (event.key === "ArrowDown") {
        event.preventDefault()
        handleOpenChange(true)
        return
      }
      handleInputKeyDown(event)
    },
    [handleInputKeyDown, handleOpenChange],
  )

  const dateLabel =
    value
      ? value.toLocaleDateString("es-PE", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        })
      : (placeholder ?? "Fecha")

  return (
    <Popover open={open} onOpenChange={disabled ? undefined : handleOpenChange}>
      <PopoverTrigger asChild>
        {iconOnly ? (
          <button
            type="button"
            disabled={disabled}
            aria-label={dateLabel}
            title={dateLabel}
            className={
              className ??
              "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-foreground/5 hover:text-foreground disabled:opacity-40"
            }
          >
            <Calendar size={16} />
          </button>
        ) : (
          <div className={className}>
            <DateInput
              ref={inputRef}
              value={inputValue}
              placeholder={placeholder}
              disabled={disabled}
              onChange={handleInputChange}
              onBlur={handleInputBlur}
              onKeyDown={handleKeyDownWithEscape}
              onFocus={handleInputFocus}
              onClick={() => {
                if (!isMobile) handleOpenChange(true)
              }}
            />
          </div>
        )}
      </PopoverTrigger>

      <PopoverContent
        sideOffset={6}
        onOpenAutoFocus={e => {
          e.preventDefault()
        }}
        floatingClassName="w-auto p-0 rounded-xl shadow-xl bg-popover"
        className="mx-auto flex w-full max-w-xs flex-col items-center justify-center gap-3 p-4"
      >
        {isMobile && !iconOnly && (
          <div className="flex w-full justify-center">
            <div className="w-full max-w-70">
              <DateInput
                ref={sheetInputRef}
                value={inputValue}
                placeholder={placeholder ?? "DD/MM/YYYY"}
                disabled={disabled}
                onChange={handleInputChange}
                onBlur={handleInputBlur}
                onKeyDown={handleKeyDownWithEscape}
                onFocus={handleInputFocus}
                hideCalendarIcon
              />
            </div>
          </div>
        )}

        <div className="flex w-full justify-center">
          <DateCalendar
            value={value}
            displayDate={livePreviewDate}
            minDate={minDate}
            maxDate={maxDate}
            markedDates={markedDates}
            onViewMonthChange={onViewMonthChange}
            onSelect={handleSelectDay}
          />
        </div>
      </PopoverContent>
    </Popover>
  )
}