"use client"

import { ChevronLeft, ChevronRight } from "lucide-react"

import { DatePicker } from "@/shared/ui/date-picker/components/date-picker"
import { cn } from "@/shared/utils/utils"

type Props = {
  value: Date | null
  onChange: (date: Date | null) => void
  placeholder?: string
  minDate?: Date
  maxDate?: Date
  className?: string
}

function addDays(date: Date, amount: number) {
  const next = new Date(date)
  next.setDate(next.getDate() + amount)
  return next
}

// Wrapper de un solo uso alrededor del DatePicker genérico: le
// agrega flechas prev/next para correr el día sin abrir el
// calendario. No se mete esto en DatePicker directamente porque
// ese componente es usado en formularios/filtros donde navegar
// "día a día" no tiene sentido (ej. fecha de nacimiento) — acá es
// específico para vistas tipo bitácora, donde se navega por día.
export function DateNavigator({
  value,
  onChange,
  placeholder,
  minDate,
  maxDate,
  className,
}: Props) {

  const current = value ?? new Date()

  const atMin = minDate != null && current <= minDate
  const atMax = maxDate != null && current >= maxDate

  function goTo(amount: number) {
    onChange(addDays(current, amount))
  }

  return (

    <div className={cn("flex items-center gap-1", className)}>

      <button
        type="button"
        onClick={() => goTo(-1)}
        disabled={atMin}
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
      />

      <button
        type="button"
        onClick={() => goTo(1)}
        disabled={atMax}
        aria-label="Día siguiente"
        className="flex h-10 w-9 shrink-0 items-center justify-center rounded-lg text-neutral-400 transition-colors hover:bg-white/5 hover:text-white disabled:pointer-events-none disabled:opacity-30"
      >
        <ChevronRight size={16} />
      </button>

    </div>

  )

}