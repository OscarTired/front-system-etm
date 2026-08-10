"use client"

/**
 * Skeleton a la medida del NestingPage real:
 * Desktop: aside piezas (header PIEZAS + search + filas nombre/dims/qty) + canvas
 *          con outline de plancha (no grilla 4×3 de celdas).
 * Compact: tabs superiores + canvas full.
 */

import { useResponsive } from "@/shared/responsive/hooks/use-responsive"
import { cn } from "@/shared/utils/utils"

const PIECE_ROWS = [
  { title: "w-[72%]", meta: "w-[48%]", qty: true },
  { title: "w-[65%]", meta: "w-[40%]", qty: true },
  { title: "w-[80%]", meta: "w-[52%]", qty: true },
  { title: "w-[58%]", meta: "w-[36%]", qty: true },
  { title: "w-[70%]", meta: "w-[44%]", qty: true },
  { title: "w-[62%]", meta: "w-[38%]", qty: true },
  { title: "w-[75%]", meta: "w-[50%]", qty: true },
  { title: "w-[55%]", meta: "w-[32%]", qty: true },
]

export function NestingPageSkeleton() {
  const { isCompact, ready } = useResponsive()
  const compact = !ready || isCompact

  if (compact) {
    return (
      <div className="absolute inset-0 animate-pulse overflow-hidden bg-[#050505]">
        {/* Top chrome: sheet tabs + actions (como UI real) */}
        <div className="absolute inset-x-0 top-0 z-10 flex h-11 items-center gap-1.5 px-1 pt-1">
          <div className="flex h-9 min-w-0 flex-1 items-center gap-2 overflow-hidden rounded-xl bg-white/4 px-3 ring-1 ring-white/6">
            <span className="h-5 w-16 shrink-0 rounded-md bg-white/12" />
            <span className="h-5 w-14 shrink-0 rounded-md bg-white/8" />
            <span className="h-5 w-12 shrink-0 rounded-md bg-white/6" />
            <span className="ml-auto size-6 shrink-0 rounded-md bg-white/10" />
          </div>
          <span className="size-9 shrink-0 rounded-xl bg-white/8 ring-1 ring-white/10" />
        </div>

        <div className="absolute inset-x-0 bottom-0 top-12 mx-1 mb-1 overflow-hidden rounded-xl bg-[#0a0a0c] ring-1 ring-white/8">
          <SheetCanvasSkeleton />
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-full min-h-0 w-full animate-pulse gap-3 overflow-hidden bg-[#050505] desktop:gap-4">
      {/* Aside — calco panel PIEZAS */}
      <aside className="flex h-full w-80 shrink-0 flex-col overflow-hidden rounded-2xl bg-white/3">
        {/* Header: PIEZAS + count + icons */}
        <div className="flex shrink-0 items-center gap-2 border-b border-white/6 px-3 py-2.5">
          <span className="h-3 w-14 rounded bg-white/15" />
          <span className="h-4 w-6 rounded-md bg-white/10" />
          <div className="ml-auto flex items-center gap-1.5">
            <span className="size-7 rounded-lg bg-white/8" />
            <span className="size-7 rounded-lg bg-white/8" />
            <span className="size-7 rounded-lg bg-white/8" />
          </div>
        </div>

        {/* Search */}
        <div className="shrink-0 px-3 pt-2.5">
          <div className="flex h-9 items-center gap-2 rounded-lg bg-white/5 px-3 ring-1 ring-white/6">
            <span className="size-3.5 rounded bg-white/12" />
            <span className="h-2.5 w-20 rounded bg-white/8" />
          </div>
        </div>

        {/* Agrupar chips */}
        <div className="flex shrink-0 gap-1.5 px-3 py-2">
          <span className="h-6 w-16 rounded-md bg-white/10" />
          <span className="h-6 w-14 rounded-md bg-white/6" />
          <span className="h-6 w-14 rounded-md bg-white/6" />
        </div>

        {/* Lista de piezas — filas como PieceListRow */}
        <div className="min-h-0 flex-1 space-y-1 overflow-hidden px-2 pb-2">
          {PIECE_ROWS.map((row, i) => (
            <div
              key={i}
              className="flex items-center gap-2 rounded-xl px-2 py-2"
              style={{ opacity: 1 - i * 0.08 }}
            >
              <div className="min-w-0 flex-1">
                <span
                  className={cn("block h-3 rounded bg-white/14", row.title)}
                />
                <span
                  className={cn("mt-1.5 block h-2.5 rounded bg-white/7", row.meta)}
                />
              </div>
              <span className="h-7 w-8 shrink-0 rounded-md bg-white/10" />
              <span className="size-7 shrink-0 rounded-md bg-white/8" />
              <span className="size-7 shrink-0 rounded-md bg-white/8" />
            </div>
          ))}
        </div>

        {/* Nestear */}
        <div className="shrink-0 border-t border-white/6 p-3">
          <span className="block h-10 w-full rounded-xl bg-white/12" />
        </div>
      </aside>

      {/* Canvas column */}
      <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-2 overflow-hidden">
        {/* Sheet status bar */}
        <div className="flex h-9 w-full shrink-0 items-center gap-2 rounded-xl bg-white/4 px-3 ring-1 ring-white/6">
          <span className="h-5 w-24 rounded-md bg-white/12" />
          <span className="h-5 w-20 rounded-md bg-white/8" />
          <span className="h-5 w-16 rounded-md bg-white/6" />
          <span className="ml-auto h-5 w-14 rounded-md bg-white/10" />
        </div>

        <div className="relative min-h-0 flex-1 overflow-hidden rounded-xl bg-[#0a0a0c] ring-1 ring-white/8">
          <SheetCanvasSkeleton />
        </div>
      </div>
    </div>
  )
}

/** Plancha rectangular centrada (no grilla de celdas). */
function SheetCanvasSkeleton() {
  return (
    <div className="relative h-full w-full">
      {/* Plancha */}
      <div className="absolute inset-0 flex items-center justify-center p-8">
        <div className="relative h-[72%] w-[78%] max-w-4xl rounded-sm ring-1 ring-white/12">
          {/* Márgenes / contorno interior */}
          <div className="absolute inset-3 rounded-sm ring-1 ring-white/6" />
          {/* Piezas fantasma irregulares dentro de la plancha */}
          <div className="absolute left-[8%] top-[12%] h-[18%] w-[28%] rounded-sm bg-white/6 ring-1 ring-white/8" />
          <div className="absolute left-[40%] top-[10%] h-[22%] w-[20%] rounded-sm bg-white/5 ring-1 ring-white/7" />
          <div className="absolute right-[10%] top-[14%] h-[16%] w-[22%] rounded-sm bg-white/6 ring-1 ring-white/8" />
          <div className="absolute bottom-[18%] left-[12%] h-[20%] w-[24%] rounded-sm bg-white/5 ring-1 ring-white/7" />
          <div className="absolute bottom-[15%] left-[42%] h-[14%] w-[18%] rounded-sm bg-white/6 ring-1 ring-white/8" />
          <div className="absolute bottom-[20%] right-[12%] h-[24%] w-[20%] rounded-sm bg-white/5 ring-1 ring-white/7" />
        </div>
      </div>

      {/* Tool FAB izquierda */}
      <span className="absolute left-2 top-2 size-9 rounded-full bg-white/10 ring-1 ring-white/8" />

      {/* View controls derecha */}
      <div className="absolute right-2 top-2 flex flex-col gap-1.5">
        <span className="size-9 rounded-full bg-white/10 ring-1 ring-white/8" />
        <span className="size-9 rounded-full bg-white/8 ring-1 ring-white/6" />
      </div>

      {/* Status bottom-left */}
      <span className="absolute bottom-3 left-3 h-8 w-28 rounded-full bg-white/8 ring-1 ring-white/6" />
    </div>
  )
}
