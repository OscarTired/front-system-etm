"use client"

import { usePageTitle } from "@/shared/responsive/navigation/hooks/use-page-title"
import { NestingPage } from "@/features/nesting/components/nesting-page"

export default function NestingRoute() {
  usePageTitle("Nesting")

  return (
    <main className="flex h-full min-h-0 flex-col bg-[#050505] px-3 pt-14 pb-2 text-white select-none tablet:px-4 desktop:px-5 desktop:pt-1 desktop:pb-3">
      <header className="mb-1 hidden shrink-0 flex-wrap items-center justify-between gap-2 desktop:flex">
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

      <section className="flex min-h-0 w-full flex-1 flex-col">
        <NestingPage />
      </section>
    </main>
  )
}