"use client"

import { Check, X } from "lucide-react"

import { Spinner } from "@/shared/ui/spinner/spinner"
import { cn } from "@/shared/utils/utils"

type Props = {
  operatorName: string
  count: number
  mode: "ASSIGN" | "INVITE"
  onModeChange: (mode: "ASSIGN" | "INVITE") => void
  onConfirm: () => void
  onCancel: () => void
  confirming?: boolean
}

export function SummonConfirmBarContent({
  operatorName,
  count,
  mode,
  onModeChange,
  onConfirm,
  onCancel,
  confirming,
}: Props) {
  return (
    <div className="flex items-center gap-3">
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-foreground">
          {count} {count === 1 ? "tarea" : "tareas"} para {operatorName}
        </p>
        <div className="mt-1.5 flex gap-1">
          <button
            type="button"
            onClick={() => onModeChange("ASSIGN")}
            className={cn(
              "rounded-md px-2 py-1 text-[11px] font-medium transition-colors",
              mode === "ASSIGN"
                ? "bg-foreground/15 text-foreground"
                : "text-muted-foreground hover:text-muted-foreground",
            )}
          >
            Asignar directo
          </button>
          <button
            type="button"
            onClick={() => onModeChange("INVITE")}
            className={cn(
              "rounded-md px-2 py-1 text-[11px] font-medium transition-colors",
              mode === "INVITE"
                ? "bg-foreground/15 text-foreground"
                : "text-muted-foreground hover:text-muted-foreground",
            )}
          >
            Invitar
          </button>
        </div>
      </div>

      <button
        type="button"
        onClick={onCancel}
        aria-label="Cancelar"
        className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-foreground/5 text-muted-foreground transition-colors hover:bg-foreground/10"
      >
        <X size={16} />
      </button>

      <button
        type="button"
        onClick={onConfirm}
        disabled={count === 0 || confirming}
        className={cn(
          "flex h-9 shrink-0 items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 text-sm font-semibold text-white transition-opacity",
          count === 0 && "opacity-40",
        )}
      >
        {confirming ? (
          <Spinner size={16} className="text-white" />
        ) : (
          <Check size={16} />
        )}
        OK
      </button>
    </div>
  )
}

/**
 * Pie del panel (flex), mismo fondo que el card — no absolute ni border-t
 * que “corta” visualmente el panel.
 */
export function SummonConfirmBar(props: Props) {
  return (
    <div className="animate-slide-up-in shrink-0 bg-card px-4 py-3">
      <SummonConfirmBarContent {...props} />
    </div>
  )
}
