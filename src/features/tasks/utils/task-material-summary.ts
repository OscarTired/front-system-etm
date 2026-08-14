import type { Task } from "../types/task.types"

/** Etiqueta compacta para cards: INOX o INOX+2 */
export function getTaskMaterialLabel(task: Task): string {
  const lines = task.materialLines
  if (!lines || lines.length <= 1) {
    return task.material?.name ?? "—"
  }
  const primary = [...lines].sort((a, b) => b.pieces - a.pieces)[0]
  const extra = lines.length - 1
  return `${primary.material.name}+${extra}`
}

export function getTaskPiecesTotal(task: Task): number {
  if (task.materialLines && task.materialLines.length > 0) {
    return task.materialLines.reduce((s, l) => s + l.pieces, 0)
  }
  return task.pieces
}
