"use client"

import { usePageTitle } from "@/shared/responsive/navigation/hooks/use-page-title"

import { ActivityLogPageContent } from "@/features/activity-log/components/activity-log-page-content"

export default function BitacoraIngenieriaPage() {

  usePageTitle("Bitácora de Ingeniería")

  return (

    <main className="flex flex-col bg-[#050505] px-4 pt-0 pb-5 text-white select-none tablet:px-8 tablet:pt-0 desktop:py-10">

      <header className="hidden flex-wrap items-center justify-between gap-4 mb-4 desktop:flex">

        <div className="min-w-0 flex-1 items-center gap-2 flex">

          <h1 className="shrink-0 text-2xl font-bold tracking-widest">
            BITÁCORA DE INGENIERÍA
          </h1>

          <span className="h-1 w-1 shrink-0 rounded-full bg-neutral-700" />

          <p className="min-w-0 truncate text-sm text-neutral-500">
            Qué hiciste hoy
          </p>

        </div>

        <div className="invisible shrink-0 pointer-events-none select-none" aria-hidden="true">
          <div className="inline-flex h-10 items-center justify-center px-5 text-sm font-semibold">
            Placeholder
          </div>
        </div>

      </header>

      <ActivityLogPageContent department="INGENIERIA" />

    </main>

  )

}