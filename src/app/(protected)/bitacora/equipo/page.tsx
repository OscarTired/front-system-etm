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

    <main className="flex flex-col bg-[#050505] px-4 pt-0 pb-5 text-white select-none tablet:h-full tablet:px-8 tablet:pt-0 desktop:py-10">

      <header className="hidden flex-wrap items-center justify-between gap-4 mb-4 desktop:flex">

        <div className="flex min-w-0 flex-1 items-center gap-2">

          <h1 className="shrink-0 text-2xl font-bold tracking-widest">
            BITÁCORA DEL EQUIPO
          </h1>

          <span className="h-1 w-1 shrink-0 rounded-full bg-neutral-700" />

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