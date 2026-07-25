"use client"

import {
  TeamActivityLogPageContent,
} from "@/features/activity-log/components/team-activity-log-page-content"

import {
  usePageTitle,
} from "@/shared/responsive/navigation/hooks/use-page-title"

import {
  VerticalScroll,
} from "@/shared/ui/vertical-scroll/vertical-scroll"

export default function TeamBitacoraPage() {

  usePageTitle("Bitácora del equipo")

  return (

    <main className="flex flex-col bg-[#050505] px-4 pt-3 pb-5 text-white select-none tablet:h-full tablet:px-8 tablet:py-10">

      <header className="hidden flex-wrap items-start justify-between gap-4 tablet:flex">

        <div className="flex min-w-0 flex-1 items-center gap-2">

          <h1 className="shrink-0 text-xl font-bold tracking-widest tablet:text-2xl">
            BITÁCORA DEL EQUIPO
          </h1>

          <span className="hidden h-1 w-1 shrink-0 rounded-full bg-neutral-700 tablet:block" />

          <p className="min-w-0 truncate text-sm text-neutral-500">
            Qué hizo cada persona
          </p>

        </div>

      </header>

      <section className="mt-2 min-h-0 flex-1 overflow-hidden tablet:mt-3">

        <VerticalScroll containerClassName="h-full">

          <TeamActivityLogPageContent />

        </VerticalScroll>

      </section>

    </main>

  )

}