"use client"

import dynamic from "next/dynamic"
import { usePageTitle } from "@/shared/responsive/navigation/hooks/use-page-title"
import { NestingPageSkeleton } from "@/features/nesting/components/nesting-page-skeleton"

const NestingWorkspace = dynamic(
  () =>
    import("@/features/nesting/components/nesting-page").then((m) => m.NestingPage),
  {
    ssr: false,
    loading: () => <NestingPageSkeleton />,
  },
)

/**
 * Mobile: altura = viewport − top bar − bottom nav (VerticalScroll del shell).
 * Dynamic import: el chunk de nesting (canvas, worker, draft) no bloquea
 * el cierre del drawer ni el primer paint al navegar.
 */
export default function NestingRoute() {
  usePageTitle("Nesting")

  return (
    <main
      className={
        "flex min-h-0 flex-col bg-[#050505] px-3 pt-0 pb-2 text-white select-none " +
        "h-[calc(100dvh-8.5rem)] " +
        "tablet:h-full tablet:px-8 tablet:pb-5 " +
        "desktop:h-full desktop:py-10"
      }
    >
      <header className="mb-4 hidden flex-wrap items-center justify-between gap-4 desktop:flex">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <h1 className="shrink-0 text-2xl font-bold tracking-widest">NESTING</h1>
          <span className="h-1 w-1 shrink-0 rounded-full bg-neutral-700" />
          <p className="min-w-0 truncate text-sm text-neutral-500">
            Acomodo de piezas en plancha
          </p>
        </div>
        <div aria-hidden className="h-10 w-10 shrink-0" />
      </header>

      <section className="min-h-0 flex-1">
        <NestingWorkspace />
      </section>
    </main>
  )
}
