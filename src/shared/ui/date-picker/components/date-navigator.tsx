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
}

function addDays(date: Date, amount: number) {
  const next = new Date(date)
  next.setDate(next.getDate() + amount)
  return next
}

export function DateNavigator({
  value,
  onChange,
  placeholder,
  minDate,
  maxDate,
  className,
  markedDates,
}: Props) {
  const current = value ?? new Date()
  const [pickerOpen, setPickerOpen] = useState(false)

  const atMin = minDate != null && stripTime(current) <= stripTime(minDate)
  const atMax = maxDate != null && stripTime(current) >= stripTime(maxDate)

  // Con el calendario abierto, las flechas no mueven el día
  const arrowsDisabled = pickerOpen

  function goTo(amount: number) {
    if (arrowsDisabled) return
    onChange(addDays(current, amount))
  }

  return (
    <div className={cn("flex items-center gap-1", className)}>
      <button
        type="button"
        onClick={() => goTo(-1)}
        disabled={atMin || arrowsDisabled}
        aria-label="Día anterior"
        className="flex h-10 w-9 shrink-0 items-center justify-center rounded-lg text-neutral-400 transition-colors hover:bg-white/5 hover:text-white disabled:pointer-events-none disabled:opacity-30"
      >
        <ChevronLeft size={16} />
      </button>

      <DatePicker
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        minDate={minDate}
        maxDate={maxDate}
        markedDates={markedDates}
        onOpenChange={setPickerOpen}
      />

      <button
        type="button"
        onClick={() => goTo(1)}
        disabled={atMax || arrowsDisabled}
        aria-label="Día siguiente"
        className="flex h-10 w-9 shrink-0 items-center justify-center rounded-lg text-neutral-400 transition-colors hover:bg-white/5 hover:text-white disabled:pointer-events-none disabled:opacity-30"
      >
        <ChevronRight size={16} />
      </button>
    </div>
  )
}