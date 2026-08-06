import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import type { ToolpathSeg } from "../types/types"

const BASE_MM_PER_SEC = 80

/**
 * Simulación de recorrido de corte.
 * - progress en ref para que el draw lea sin depender del render
 * - al interactuar con la vista (pan/zoom) se limpia el overlay idle
 */
export function useSimulation() {
  const [panelOpen, setPanelOpen] = useState(false)
  const [running, setRunning] = useState(false)
  const [progress, setProgress] = useState(0)
  const [speed, setSpeed] = useState(1)
  const [hasToolpath, setHasToolpath] = useState(false)

  const progressRef = useRef(0)
  const runningRef = useRef(false)
  const totalLengthRef = useRef(0)
  const segmentsRef = useRef<ToolpathSeg[]>([])
  const fullPath2DRef = useRef<Path2D | null>(null)
  const rafRef = useRef<number | null>(null)
  const lastTsRef = useRef<number | null>(null)

  useEffect(() => {
    progressRef.current = progress
  }, [progress])

  useEffect(() => {
    runningRef.current = running
  }, [running])

  const setToolpath = useCallback(
    (segments: ToolpathSeg[], totalLength: number, fullPath: Path2D | null) => {
      segmentsRef.current = segments
      totalLengthRef.current = totalLength
      fullPath2DRef.current = fullPath
      setHasToolpath(totalLength > 0)
      setProgress(0)
      progressRef.current = 0
      setRunning(false)
      runningRef.current = false
    },
    []
  )

  const clearOverlayIfIdle = useCallback(() => {
    if (!runningRef.current && progressRef.current > 0) {
      setProgress(0)
      progressRef.current = 0
    }
  }, [])

  const openPanel = useCallback(() => setPanelOpen(true), [])

  const closePanel = useCallback(() => {
    setRunning(false)
    runningRef.current = false
    setProgress(0)
    progressRef.current = 0
    setPanelOpen(false)
  }, [])

  const togglePlay = useCallback(() => {
    setProgress((prev) => {
      if (prev >= 1) {
        progressRef.current = 0
        return 0
      }
      return prev
    })
    setRunning((v) => !v)
  }, [])

  const reset = useCallback(() => {
    setRunning(false)
    runningRef.current = false
    setProgress(0)
    progressRef.current = 0
  }, [])

  const seek = useCallback((value: number) => {
    setRunning(false)
    runningRef.current = false
    setProgress(value)
    progressRef.current = value
  }, [])

  useEffect(() => {
    if (!running) {
      lastTsRef.current = null
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
      return
    }

    const tick = (ts: number) => {
      if (lastTsRef.current === null) lastTsRef.current = ts
      const deltaSec = Math.min(0.05, (ts - lastTsRef.current) / 1000)
      lastTsRef.current = ts

      const totalLen = totalLengthRef.current || 1
      const deltaProgress = (BASE_MM_PER_SEC * speed * deltaSec) / totalLen

      setProgress((prev) => {
        const next = prev + deltaProgress
        if (next >= 1) {
          setRunning(false)
          runningRef.current = false
          return 1
        }
        return next
      })

      rafRef.current = requestAnimationFrame(tick)
    }

    rafRef.current = requestAnimationFrame(tick)
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
    }
  }, [running, speed])

  // Igual que en useCanvasView: sin memoizar, este objeto era nuevo en
  // cada render sin importar si algo cambió, así que ningún efecto podía
  // depender de `sim` de forma segura (se re-ejecutaba siempre). Acá SÍ
  // hay estado real (panelOpen/running/progress/speed/hasToolpath), así
  // que memoizamos contra esos valores: `sim` solo cambia de identidad
  // cuando alguno de ellos cambia de verdad, nunca por un render ajeno.
  return useMemo(
    () => ({
      panelOpen,
      running,
      progress,
      speed,
      hasToolpath,
      progressRef,
      runningRef,
      totalLengthRef,
      segmentsRef,
      fullPath2DRef,
      setToolpath,
      clearOverlayIfIdle,
      openPanel,
      closePanel,
      togglePlay,
      reset,
      seek,
      setSpeed,
    }),
    [
      panelOpen,
      running,
      progress,
      speed,
      hasToolpath,
      setToolpath,
      clearOverlayIfIdle,
      openPanel,
      closePanel,
      togglePlay,
      reset,
      seek,
    ],
  )
}
