import { toast } from "sonner"

const COUNTDOWN_MS = 10_000

/**
 * Toast con contador regresivo (10s) que se cierra solo.
 * Sonner no expone update fácil del description cada segundo, así que
 * usamos un id estable y re-emitimos el toast actualizando el texto.
 */
function toastWithCountdown(
  kind: "message" | "warning" | "success",
  title: string,
  baseDescription: string,
  action?: { label: string; onClick: () => void },
) {
  const id = `nest-cd-${title}-${Date.now()}`
  let left = Math.round(COUNTDOWN_MS / 1000)

  const show = () => {
    const description = `${baseDescription} · se cierra en ${left}s`
    const opts = {
      id,
      description,
      duration: COUNTDOWN_MS + 500,
      action,
    }
    if (kind === "warning") toast.warning(title, opts)
    else if (kind === "success") toast.success(title, opts)
    else toast(title, opts)
  }

  show()
  const timer = window.setInterval(() => {
    left -= 1
    if (left <= 0) {
      window.clearInterval(timer)
      toast.dismiss(id)
      return
    }
    show()
  }, 1000)

  return id
}

export const NestingToast = {
  rotateOutOfSheet: () =>
    toast.warning("No se puede rotar", {
      description: "La pieza quedaría fuera de la zona de trabajo.",
    }),
  rotateCollision: () =>
    toast.warning("No se puede rotar", {
      description: "La rotación colisiona con otra pieza.",
    }),
  alignNone: () =>
    toast.warning("No se pudo alinear", {
      description: "No hay espacio libre hacia la posición objetivo.",
    }),
  alignNeedTwo: () => toast.message("Selecciona al menos 2 piezas para alinear"),
  needSelection: () => toast.message("Selecciona una o más piezas"),
  locked: () =>
    toast.message("Pieza bloqueada", {
      description: "Desbloquéala para moverla o rotarla.",
    }),
  nestEmpty: () =>
    toast.message("No hay piezas", {
      description: "Importa piezas antes de nestear.",
    }),
  nestRunning: () => toast.message("Nesting en curso…"),
  pasteEmpty: () =>
    toast.message("Portapapeles vacío", {
      description: "Copia offsets de una pieza primero.",
    }),
  copyOk: (n: number) =>
    toast.success(n === 1 ? "Offsets copiados" : `${n} offsets copiados`),

  /** Aviso: cambió separación o modo — hay que nestear de nuevo. */
  renestNeeded: (reason: string) =>
    toastWithCountdown("message", "Nestear de nuevo", reason),

  /** Trabajo restaurado del navegador, con Descartar y auto-cierre 10s. */
  sessionRestored: (savedAt: string | null, onDiscard: () => void) =>
    toastWithCountdown(
      "message",
      "Trabajo restaurado",
      savedAt
        ? `Recuperado del navegador · ${new Date(savedAt).toLocaleString()}`
        : "Recuperado del navegador",
      { label: "Descartar", onClick: onDiscard },
    ),
} as const

export { COUNTDOWN_MS }
