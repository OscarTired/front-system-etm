import { toast } from "sonner"

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
} as const