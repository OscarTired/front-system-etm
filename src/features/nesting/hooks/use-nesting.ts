"use client"

import { useCallback, useRef, useState } from "react"

import type {
  NestedSheet,
  NestingOptions,
  NestingPiece,
} from "../engine/types"
import { nestingRunApi } from "../api/nesting-run.api"

export type NestingStatus =
  | "idle"
  | "running"
  | "done"
  | "cancelled"
  | "error"

export type UseNestingResult = {
  status: NestingStatus
  /** 0–1. En API síncrona solo 0 mientras corre y 1 al terminar. */
  progress: number
  sheets: NestedSheet[] | null
  error: string | null
  run: (
    pieces: NestingPiece[],
    options: Omit<NestingOptions, "onProgress" | "signal">,
  ) => void
  cancel: () => void
  restoreSheets: (next: NestedSheet[] | null) => void
  clearSheets: () => void
}

/**
 * Nesting vía backend (POST /engineering/nest).
 * Sin worker ni motor local — la autoridad es el servidor.
 */
export function useNesting(): UseNestingResult {
  const [status, setStatus] = useState<NestingStatus>("idle")
  const [progress, setProgress] = useState(0)
  const [sheets, setSheets] = useState<NestedSheet[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  const sheetsRef = useRef<NestedSheet[] | null>(null)
  const prevSheetsRef = useRef<NestedSheet[] | null>(null)
  const genRef = useRef(0)
  const abortRef = useRef<AbortController | null>(null)

  sheetsRef.current = sheets

  const run = useCallback(
    (
      pieces: NestingPiece[],
      options: Omit<NestingOptions, "onProgress" | "signal">,
    ) => {
      abortRef.current?.abort()
      const ac = new AbortController()
      abortRef.current = ac
      const gen = ++genRef.current

      prevSheetsRef.current = sheetsRef.current
      setStatus("running")
      setProgress(0)
      setSheets(null)
      setError(null)

      void nestingRunApi
        .run({ pieces, options }, ac.signal)
        .then(data => {
          if (gen !== genRef.current) return
          setSheets(data.sheets)
          setStatus("done")
          setProgress(1)
        })
        .catch(err => {
          if (gen !== genRef.current) return
          if (
            err?.code === "ERR_CANCELED" ||
            err?.name === "CanceledError" ||
            err?.name === "AbortError"
          ) {
            setSheets(prevSheetsRef.current)
            setStatus(prevSheetsRef.current ? "done" : "cancelled")
            setProgress(prevSheetsRef.current ? 1 : 0)
            return
          }
          const message =
            err?.response?.data?.message ??
            (err instanceof Error ? err.message : "Error en nesting")
          setError(
            Array.isArray(message) ? message.join(", ") : String(message),
          )
          setStatus("error")
        })
    },
    [],
  )

  const cancel = useCallback(() => {
    genRef.current += 1
    abortRef.current?.abort()
    abortRef.current = null
    setSheets(prevSheetsRef.current)
    setStatus(prevSheetsRef.current ? "done" : "cancelled")
    setProgress(prevSheetsRef.current ? 1 : 0)
  }, [])

  const restoreSheets = useCallback((next: NestedSheet[] | null) => {
    const cleaned = next ? next.filter(s => s.pieces.length > 0) : null
    const final = cleaned && cleaned.length > 0 ? cleaned : null
    setSheets(final)
    setStatus(final ? "done" : "idle")
    setProgress(final ? 1 : 0)
    setError(null)
  }, [])

  const clearSheets = useCallback(() => {
    setSheets(null)
    setStatus("idle")
    setProgress(0)
    setError(null)
  }, [])

  return {
    status,
    progress,
    sheets,
    error,
    run,
    cancel,
    restoreSheets,
    clearSheets,
  }
}
