"use client"

import { Spinner } from "@/shared/ui/spinner/spinner"
import { cn } from "@/shared/utils/utils"

type Props = {
  canSave: boolean
  saving?: boolean
  saveLabel?: string
  savingLabel?: string
  cancelLabel?: string
  onCancel: () => void
  onSave: () => void
  start?: React.ReactNode
}

export function FormDialogFooter({
  canSave,
  saving = false,
  saveLabel = "Guardar",
  savingLabel,
  cancelLabel = "Cancelar",
  onCancel,
  onSave,
  start,
}: Props) {
  return (
    <div className="flex items-center gap-3">
      {start}

      {/* Cancelar / Guardar (o Atrás / Siguiente) siempre a la derecha */}
      <div className="ml-auto flex items-center gap-3">
        <button
          type="button"
          disabled={saving}
          onClick={onCancel}
          className="rounded-xl bg-foreground/5 px-4 py-2.5 text-sm font-medium text-muted-foreground transition-all hover:bg-foreground/10 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
        >
          {cancelLabel}
        </button>

        <button
          type="button"
          disabled={saving}
          onClick={onSave}
          aria-label={saving ? (savingLabel ?? saveLabel) : undefined}
          className={cn(
            "flex min-w-38 items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold transition",
            saving
              ? "cursor-not-allowed bg-foreground/10 text-muted-foreground"
              : canSave
                ? "bg-foreground text-background hover:bg-foreground/90"
                : "bg-foreground/10 text-muted-foreground hover:bg-foreground/15",
          )}
        >
          {saving ? <Spinner size={16} /> : saveLabel}
        </button>
      </div>
    </div>
  )
}
