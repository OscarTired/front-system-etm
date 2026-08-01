"use client"

import { NestingPage as NestingWorkspace } from "@/features/nesting/components/nesting-page"
import { usePageTitle } from "@/shared/responsive/navigation/hooks/use-page-title"

export default function NestingRoute() {
  usePageTitle("Nesting")

  return (
    <main className="flex flex-col bg-[#050505] px-4 pt-0 pb-5 text-white select-none tablet:px-8 tablet:pt-0 desktop:py-10 tablet:h-full">
      <header className="hidden flex-wrap items-center justify-between gap-4 mb-4 desktop:flex">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <h1 className="shrink-0 text-2xl font-bold tracking-widest">
            NESTING
          </h1>
          <span className="h-1 w-1 shrink-0 rounded-full bg-neutral-700" />
          <p className="min-w-0 truncate text-sm text-neutral-500">
            Acomodo de piezas en plancha
          </p>
        </div>

        <div aria-hidden className="h-10 w-10 shrink-0" />
      </header>

      <section className="mt-2 min-h-0 flex-1 tablet:mt-3">
        <NestingWorkspace />
      </section>
    </main>
  )
}