/**
 * Draft único de nesting en IndexedDB (con fallback a localStorage).
 * Sobrevive a F5 / cierre de pestaña. Un solo draft por origen (taller).
 */

import type { NestedSheet } from "../engine/types"
import type { ProjectSettings, MachineSettings } from "../types/project-settings"
import type { PieceRow } from "../components/piece-list"

export const NESTING_DRAFT_KEY = "etm:nesting:draft:v1"
const IDB_NAME = "etm-nesting"
const IDB_STORE = "sessions"
const IDB_VERSION = 1

export type SheetEditSnapshot = {
  positionOverrides: Record<number, { dx: number; dy: number }>
  angleOverrides: Record<number, number>
  /** Índices de piezas bloqueadas en esta plancha (no se arrastran). */
  lockedIndices?: number[]
}

export type NestingDraftV1 = {
  formatVersion: 1
  savedAt: string
  settings: ProjectSettings
  machine: MachineSettings
  rows: PieceRow[]
  /** Resultado del último Nestear (null si aún no se nestó). */
  sheets: NestedSheet[] | null
  activeGroupIndex: number
  /** Edición manual por índice de plancha (stringified). */
  editsBySheet: Record<string, SheetEditSnapshot>
}

export function isNestingDraftV1(raw: unknown): raw is NestingDraftV1 {
  if (typeof raw !== "object" || raw === null) return false
  const o = raw as Record<string, unknown>
  return (
    o.formatVersion === 1 &&
    typeof o.savedAt === "string" &&
    typeof o.settings === "object" &&
    o.settings !== null &&
    Array.isArray(o.rows)
  )
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      reject(new Error("indexedDB no disponible"))
      return
    }
    const req = indexedDB.open(IDB_NAME, IDB_VERSION)
    req.onerror = () => reject(req.error ?? new Error("IDB open failed"))
    req.onsuccess = () => resolve(req.result)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains(IDB_STORE)) {
        db.createObjectStore(IDB_STORE)
      }
    }
  })
}

async function idbGet(key: string): Promise<unknown | null> {
  try {
    const db = await openDb()
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(IDB_STORE, "readonly")
      const store = tx.objectStore(IDB_STORE)
      const req = store.get(key)
      req.onsuccess = () => resolve(req.result ?? null)
      req.onerror = () => reject(req.error)
    })
  } catch {
    return null
  }
}

async function idbSet(key: string, value: unknown): Promise<boolean> {
  try {
    const db = await openDb()
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(IDB_STORE, "readwrite")
      const store = tx.objectStore(IDB_STORE)
      const req = store.put(value, key)
      req.onsuccess = () => resolve()
      req.onerror = () => reject(req.error)
    })
    return true
  } catch {
    return false
  }
}

async function idbDel(key: string): Promise<void> {
  try {
    const db = await openDb()
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(IDB_STORE, "readwrite")
      const store = tx.objectStore(IDB_STORE)
      const req = store.delete(key)
      req.onsuccess = () => resolve()
      req.onerror = () => reject(req.error)
    })
  } catch {
    /* ignore */
  }
}

function lsGet(key: string): unknown | null {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return null
    return JSON.parse(raw)
  } catch {
    return null
  }
}

function lsSet(key: string, value: unknown): boolean {
  try {
    localStorage.setItem(key, JSON.stringify(value))
    return true
  } catch {
    return false
  }
}

function lsDel(key: string): void {
  try {
    localStorage.removeItem(key)
  } catch {
    /* ignore */
  }
}

/** Carga el draft único. IndexedDB primero; fallback localStorage. */
export async function loadNestingDraft(): Promise<NestingDraftV1 | null> {
  const fromIdb = await idbGet(NESTING_DRAFT_KEY)
  if (isNestingDraftV1(fromIdb)) return fromIdb

  const fromLs = lsGet(NESTING_DRAFT_KEY)
  if (isNestingDraftV1(fromLs)) return fromLs

  return null
}

/** Guarda el draft. Intenta IDB; si falla, localStorage. */
export async function saveNestingDraft(draft: NestingDraftV1): Promise<"idb" | "localStorage" | "failed"> {
  const payload: NestingDraftV1 = {
    ...draft,
    formatVersion: 1,
    savedAt: new Date().toISOString(),
  }

  if (await idbSet(NESTING_DRAFT_KEY, payload)) return "idb"
  if (lsSet(NESTING_DRAFT_KEY, payload)) return "localStorage"
  return "failed"
}

export async function clearNestingDraft(): Promise<void> {
  await idbDel(NESTING_DRAFT_KEY)
  lsDel(NESTING_DRAFT_KEY)
}

export function draftHasWork(d: NestingDraftV1 | null | undefined): boolean {
  if (!d) return false
  return d.rows.length > 0 || (d.sheets != null && d.sheets.length > 0)
}