"use client"

import { useState } from "react"

import type { LucideIcon } from "lucide-react"

import { AlertTriangle } from "lucide-react"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

import { cn } from "@/shared/utils/utils"

import { Spinner } from "@/shared/ui/spinner/spinner"

import { preventNestedDialogClose } from "@/shared/ui/dialogs/prevent-nested-dialog-close"

type Props = {
  open: boolean

  title: string
  description: string

  icon?: LucideIcon

  confirmLabel?: string

  cancelLabel?: string

  /**
   * Texto accesible (aria-label/title) mientras se procesa la acción.
   * Ya no se muestra como texto visible en el botón — solo el
   * spinner — pero sigue disponible para lectores de pantalla.
   * Si no se proporciona, usa "Eliminando..." si variant es
   * "danger", o "Guardando..." por defecto.
   */
  submittingLabel?: string

  variant?: "default" | "danger"

  onClose: () => void

  onConfirm: () => void | Promise<void>
}

export function ActionDialog({
  open,
  title,
  description,
  icon: Icon = AlertTriangle,
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  submittingLabel,
  variant = "default",
  onClose,
  onConfirm,
}: Props) {
  const [submitting, setSubmitting] = useState(false)

  const danger = variant === "danger"

  // Determinar automáticamente el texto accesible según la variante
  const loadingText =
    submittingLabel ?? (danger ? "Eliminando..." : "Guardando...")

  async function handleConfirm() {
    if (submitting) {
      return
    }

    setSubmitting(true)

    try {
      await onConfirm()
    } catch {
      // El error ya se comunica vía toast donde corresponda
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={nextOpen => {
        if (nextOpen || submitting) {
          return
        }

        requestAnimationFrame(onClose)
      }}
    >
      <DialogContent
        className={cn(
          "max-w-[calc(100vw-2rem)] sm:max-w-90 rounded-2xl p-5 text-foreground shadow-2xl",
          "bg-popover backdrop-blur-xl"
        )}
        onPointerDownOutside={preventNestedDialogClose}
        onInteractOutside={preventNestedDialogClose}
      >
        <DialogHeader>
          <div className="mb-5 flex h-10 w-10 items-center justify-center rounded-xl bg-foreground/5 text-foreground">
            <Icon size={20} />
          </div>

          <DialogTitle className="text-lg font-bold text-foreground">{title}</DialogTitle>

          <DialogDescription className="pt-3 text-sm leading-relaxed text-muted-foreground">
            {description}
          </DialogDescription>
        </DialogHeader>

        {/* En móviles los botones se ordenan verticalmente (flex-col-reverse) para dar suficiente espacio al spinner */}
        <div className="mt-6 flex flex-col-reverse sm:flex-row justify-end gap-2">
          <button
            onClick={onClose}
            disabled={submitting}
            className="w-full sm:w-auto rounded-xl bg-foreground/5 px-4 py-2.5 text-center text-sm font-medium text-muted-foreground transition-all hover:border-border hover:bg-foreground/10 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
          >
            {cancelLabel}
          </button>

          <button
            onClick={handleConfirm}
            disabled={submitting}
            aria-label={submitting ? loadingText : undefined}
            className={cn(
              "relative isolate transform-gpu flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-70",
              danger
                ? "bg-red-500 text-foreground hover:bg-red-400"
                : "bg-foreground text-background hover:bg-foreground/90",
            )}
          >
            {submitting ? (
              <Spinner size={16} />
            ) : (
              <span className="relative z-10 block transform-gpu">{confirmLabel}</span>
            )}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  )
}