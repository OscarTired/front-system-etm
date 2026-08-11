"use client"

import { useState } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"

import { DatePicker } from "@/shared/ui/date-picker/components/date-picker"
import { stripTime } from "@/shared/ui/date-picker/utils/dates"
import { cn } from "@/shared/utils/utils"
import type { DayMarker } from "@/shared/ui/date-picker/types/types"

type Props = {
  value: Date | null
  onChange: (date: Date | null) => void
  placeholder?: string
  minDate?: Date
  maxDate?: Date
  className?: string
  markedDates?: Record<string, DayMarker[]>
  onViewMonthChange?: (month: Date) => void
  /** Flechas + visor del día + icono (toolbar móvil) */
  iconOnly?: boolean
}

function addDays(date: Date, amount: number) {
  const next = new Date(date)
  next.setDate(next.getDate() + amount)
  return next
}

function formatDayViewer(date: Date) {
  return date.toLocaleDateString("es-PE", {
    day: "2-digit",
    month: "2-digit",
  })
}

export function DateNavigator({
  value,
  onChange,
  placeholder,
  minDate,
  maxDate,
  className,
  markedDates,
  onViewMonthChange,
  iconOnly = false,
}: Props) {
  const current = value ?? new Date()
  const [pickerOpen, setPickerOpen] = useState(false)

  const atMin = minDate != null && stripTime(current) <= stripTime(minDate)
  const atMax = maxDate != null && stripTime(current) >= stripTime(maxDate)

  const arrowsDisabled = pickerOpen

  function goTo(amount: number) {
    if (arrowsDisabled) return
    onChange(addDays(current, amount))
  }

  const arrowClass = iconOnly
    ? "flex h-8 w-7 shrink-0 items-center justify-center rounded-lg text-neutral-400 transition-colors hover:bg-white/5 hover:text-white disabled:pointer-events-none disabled:opacity-30"
    : "flex h-10 w-9 shrink-0 items-center justify-center rounded-lg text-neutral-400 transition-colors hover:bg-white/5 hover:text-white disabled:pointer-events-none disabled:opacity-30"

  return (
    <div className={cn("flex items-center gap-0.5", className)}>
      <button
        type="button"
        onClick={() => goTo(-1)}
        disabled={atMin || arrowsDisabled}
        aria-label="Día anterior"
        className={arrowClass}
      >
        <ChevronLeft size={iconOnly ? 15 : 16} />
      </button>

      {iconOnly && (
        <span
          className="min-w-11 shrink-0 text-center text-xs font-semibold tabular-nums tracking-wide text-neutral-200"
          aria-live="polite"
        >
          {formatDayViewer(current)}
        </span>
      )}

      <DatePicker
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        minDate={minDate}
        maxDate={maxDate}
        markedDates={markedDates}
        onOpenChange={setPickerOpen}
        onViewMonthChange={onViewMonthChange}
        iconOnly={iconOnly}
      />

      <button
        type="button"
        onClick={() => goTo(1)}
        disabled={atMax || arrowsDisabled}
        aria-label="Día siguiente"
        className={arrowClass}
      >
        <ChevronRight size={iconOnly ? 15 : 16} />
      </button>
    </div>
  )
}
