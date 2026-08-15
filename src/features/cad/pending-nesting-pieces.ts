import type { CadRow } from "@/features/nesting/components/piece-list"

export const PENDING_NESTING_PIECES_KEY = "etm:pending-nesting-pieces"

/** Cola en memoria: sobrevive al double-invoke de Strict Mode. */
let memoryQueue: CadRow[] = []
let cadImportSignal = false

/** CAD → encola filas y las persiste en sessionStorage. */
export function enqueuePendingNestingPieces(rows: CadRow[]) {
  if (!rows.length) return
  memoryQueue = [...memoryQueue, ...rows]
  cadImportSignal = true
  try {
    sessionStorage.setItem(PENDING_NESTING_PIECES_KEY, JSON.stringify(memoryQueue))
  } catch {
    /* quota / private mode */
  }
}

/** true una vez si CAD envió piezas (para abrir tab Piezas). */
export function consumeCadImportSignal(): boolean {
  if (!cadImportSignal) return false
  cadImportSignal = false
  return true
}

/**
 * Absorbe sessionStorage → memoria (sin vaciar la cola de memoria).
 * Seguro llamar varias veces (Strict Mode).
 */
export function absorbPendingFromSessionStorage() {
  try {
    const raw = sessionStorage.getItem(PENDING_NESTING_PIECES_KEY)
    if (!raw) return
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed) || parsed.length === 0) return
    // Evitar duplicar si ya está en memoria (mismos ids)
    const existing = new Set(memoryQueue.map(r => r.id))
    for (const row of parsed as CadRow[]) {
      if (row && typeof row === "object" && row.id && !existing.has(row.id)) {
        memoryQueue.push(row)
        existing.add(row.id)
      }
    }
  } catch {
    /* ignore */
  }
}

/** Copia actual sin limpiar. */
export function peekPendingNestingPieces(): CadRow[] {
  absorbPendingFromSessionStorage()
  return [...memoryQueue]
}

/** Limpia memoria + sessionStorage (solo tras aplicar al state). */
export function clearPendingNestingPieces() {
  memoryQueue = []
  try {
    sessionStorage.removeItem(PENDING_NESTING_PIECES_KEY)
  } catch {
    /* ignore */
  }
}
