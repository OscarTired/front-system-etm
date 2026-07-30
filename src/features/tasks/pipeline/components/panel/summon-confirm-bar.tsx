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

// Separado del posicionamiento (ver SummonConfirmBar más abajo) para
// poder reusar el mismo contenido en dos contextos: la barra fija de
// desktop, y el bottom sheet real de mobile (Popover ya se convierte
// solo en bottom sheet con drag-to-dismiss en mobile — no hacía
// falta reinventar nada, solo separar el contenido de su cáscara).
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

        <p className="truncate text-sm font-semibold text-white">
          {count} {count === 1 ? "tarea" : "tareas"} para {operatorName}
        </p>

        <div className="mt-1.5 flex gap-1">

          <button
            type="button"
            onClick={() => onModeChange("ASSIGN")}
            className={cn(
              "rounded-md px-2 py-1 text-[11px] font-medium transition-colors",
              mode === "ASSIGN"
                ? "bg-white/15 text-white"
                : "text-neutral-500 hover:text-neutral-300",
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
                ? "bg-white/15 text-white"
                : "text-neutral-500 hover:text-neutral-300",
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
        className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-white/5 text-neutral-400 transition-colors hover:bg-white/10"
      >
        <X size={16} />
      </button>

      <button
        type="button"
        onClick={onConfirm}
        disabled={count === 0 || confirming}
        className={cn(
          "flex h-9 shrink-0 items-center gap-1.5 rounded-xl bg-emerald-500 px-4 text-sm font-semibold text-black transition-opacity",
          count === 0 && "opacity-40",
        )}
      >
        {confirming ? (
          <Spinner size={16} className="text-black" />
        ) : (
          <Check size={16} />
        )}
        OK
      </button>

    </div>

  )

}

// Versión desktop — barra anclada al panel (ver comentario abajo).
// En mobile, production/page.tsx usa SummonConfirmBarContent directo
// adentro de un Popover (bottom sheet real), no esto.
export function SummonConfirmBar(props: Props) {

  return (

    // absolute, no fixed — SheetContent (el panel) ya es position:fixed
    // por su cuenta, así que esto se ancla al PANEL (su containing
    // block), no al viewport completo. Antes, como fixed+z-50 vivía
    // FUERA del Portal de Radix (era hermano de <Sheet>, no hijo de
    // SheetContent), terminaba pintándose en otra capa de stacking y
    // quedaba tapado por el overlay con blur del Sheet.
    <div className="animate-slide-up-in absolute inset-x-0 bottom-0 z-10 border-t border-white/8 bg-[#101012] px-4 py-3">

      <SummonConfirmBarContent {...props} />

    </div>

  )

}