"use client"

/**
 * Skeleton del workspace de Nesting.
 * - Compact: calco immersive (tabs + canvas).
 * - Desktop: panel + canvas sin padding exterior (lo aporta el page).
 * Filas del panel: mismo lenguaje que ProcessCardSkeleton.
 */

import { useResponsive } from "@/shared/responsive/hooks/use-responsive"

const ROW_OPACITIES = [1, 0.85, 0.7, 0.55, 0.4, 0.3]

export function NestingPageSkeleton() {
  const { isCompact, ready } = useResponsive()
  const compact = !ready || isCompact

  if (compact) {
    return (
      <div className="absolute inset-0 animate-pulse overflow-hidden bg-[#050505]">
        <div className="absolute inset-x-0 top-0 z-10 flex h-11 items-center gap-1.5 px-1 pt-1">
          <div className="flex h-9 min-w-0 flex-1 items-center gap-2 rounded-xl bg-white/4 px-3 ring-1 ring-white/6">
            <span className="size-3.5 shrink-0 rounded bg-white/15" />
            <span className="h-3 w-16 rounded bg-white/12" />
            <span className="h-3 w-14 rounded bg-white/8" />
            <span className="ml-auto h-5 w-10 rounded-md bg-white/10" />
          </div>
          <span className="size-9 shrink-0 rounded-xl bg-white/8 ring-1 ring-white/10" />
        </div>

        <div className="absolute inset-x-0 bottom-0 top-12 mx-1 mb-1 overflow-hidden rounded-xl bg-[#0a0a0c] ring-1 ring-white/8">
          <CanvasChromeSkeleton portrait />
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-full min-h-0 w-full animate-pulse gap-3 overflow-hidden bg-[#050505] desktop:gap-4">
      <aside className="flex h-full w-80 shrink-0 flex-col gap-3 overflow-hidden rounded-2xl bg-white/3 p-3">
        <div className="flex gap-1 rounded-xl bg-white/4 p-1">
          <span className="h-8 flex-1 rounded-lg bg-white/10" />
          <span className="h-8 flex-1 rounded-lg bg-white/6" />
          <span className="h-8 flex-1 rounded-lg bg-white/6" />
        </div>

        <span className="h-3 w-20 rounded bg-white/10" />
        <span className="h-9 w-full rounded-lg bg-white/8" />
        <span className="h-9 w-full rounded-lg bg-white/6" />

        <span className="mt-1 h-3 w-24 rounded bg-white/10" />
        <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-hidden">
          {ROW_OPACITIES.map((opacity, i) => (
            <div
              key={i}
              className="flex w-full items-center gap-2.5 rounded-xl bg-white/2 px-3 py-3"
              style={{ opacity }}
            >
              <span className="size-8 shrink-0 rounded-lg bg-white/12" />
              <div className="min-w-0 flex-1">
                <span className="block h-3.5 w-3/4 rounded bg-white/12" />
                <span className="mt-1 block h-3 w-1/2 rounded bg-white/6" />
              </div>
              <span className="h-7 w-10 shrink-0 rounded-md bg-white/8" />
            </div>
          ))}
        </div>

        <span className="h-10 w-full shrink-0 rounded-xl bg-white/10" />
      </aside>

      <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-2 overflow-hidden">
        <div className="flex h-9 w-full items-center gap-2 rounded-xl bg-white/4 px-3 ring-1 ring-white/6">
          <span className="size-3.5 shrink-0 rounded bg-white/15" />
          <span className="h-3 w-20 rounded bg-white/12" />
          <span className="h-3 w-16 rounded bg-white/8" />
          <span className="ml-auto h-5 w-12 rounded-md bg-white/10" />
        </div>

        <div className="relative min-h-0 flex-1 overflow-hidden rounded-xl bg-[#0a0a0c] ring-1 ring-white/8">
          <CanvasChromeSkeleton portrait={false} />
        </div>
      </div>
    </div>
  )
}

function CanvasChromeSkeleton({ portrait }: { portrait: boolean }) {
  return (
    <div className="relative h-full w-full">
      <div className="absolute inset-0 flex items-center justify-center p-6">
        <div
          className={
            portrait
              ? "grid h-[70%] w-[42%] max-w-56 grid-cols-3 grid-rows-4 gap-1 rounded-sm p-2 ring-1 ring-white/10"
              : "grid h-[55%] w-[70%] max-w-md grid-cols-4 grid-rows-3 gap-1 rounded-sm p-2 ring-1 ring-white/10"
          }
        >
          {Array.from({ length: 12 }).map((_, i) => (
            <span
              key={i}
              className="rounded-sm bg-white/8 ring-1 ring-white/6"
              style={{ opacity: 1 - i * 0.05 }}
            />
          ))}
        </div>
      </div>

      <span className="absolute left-2 top-2 size-9 rounded-full bg-white/10 ring-1 ring-white/8" />
      <div className="absolute right-2 top-2 flex flex-col gap-1.5">
        <span className="size-9 rounded-full bg-white/10 ring-1 ring-white/8" />
        <span className="size-9 rounded-full bg-white/8 ring-1 ring-white/6" />
      </div>
      <span className="absolute bottom-3 left-3 h-8 w-28 rounded-full bg-white/8 ring-1 ring-white/6" />
    </div>
  )
}