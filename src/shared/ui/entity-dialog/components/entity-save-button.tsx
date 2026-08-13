import { Spinner } from "@/shared/ui/spinner/spinner"

import {
  cn,
} from "@/shared/utils/utils"

type Props={
  disabled: boolean
  saving?: boolean
  saveLabel?: string
  savingLabel?: string
  onClick: () => void
  className?: string
}

export function EntitySaveButton({
  disabled,
  saving = false,
  saveLabel = "Guardar",
  savingLabel,
  onClick,
  className,
}: Props){  

  const isDisabled = disabled || saving

  return(

    <button
      disabled={isDisabled}
      onClick={onClick}
      aria-label={saving ? (savingLabel ?? saveLabel) : undefined}
      className={cn(
        "flex min-w-38 items-center justify-center gap-2 rounded-xl px-7 py-3 text-sm font-semibold transition",
        saving
          ? "cursor-not-allowed bg-foreground/10 text-muted-foreground"
          : !disabled
            ? "bg-foreground text-background hover:bg-foreground/90"
            : "cursor-not-allowed bg-foreground/10 text-muted-foreground/80",
        className
      )}
    >

      {saving ? (
        <Spinner size={16} />
      ) : (
        saveLabel
      )}

    </button>

  )

}