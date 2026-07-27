"use client"

import { usePageTitle } from "@/shared/responsive/navigation/hooks/use-page-title"

import { VerticalScroll } from "@/shared/ui/vertical-scroll/vertical-scroll"

import { ActivityLogPageContent } from "@/features/activity-log/components/activity-log-page-content"
import { TaskAreaPanelTrigger } from "@/features/tasks/pipeline/components/panel/task-area-panel-trigger"

export default function BitacoraPage() {

  usePageTitle("Bitácora de Producción")

  return (

    <main className="flex flex-col bg-[#050505] px-4 pt-0 pb-5 text-white select-none tablet:h-full tablet:px-8 tablet:pt-0 desktop:py-10">

      <header className="hidden flex-wrap items-center justify-between gap-4 mb-4 desktop:flex">

        <div className="min-w-0 flex-1 items-center gap-2 flex">

          <h1 className="shrink-0 text-2xl font-bold tracking-widest">
            BITÁCORA DE PRODUCCIÓN
          </h1>

          <span className="h-1 w-1 shrink-0 rounded-full bg-neutral-700" />

          <p className="min-w-0 truncate text-sm text-neutral-500">
            Qué hiciste hoy
          </p>

        </div>

        <div className="flex shrink-0 items-center gap-2">

          <TaskAreaPanelTrigger />

        </div>

      </header>

      <div className="desktop:hidden flex justify-end mb-2">
        <TaskAreaPanelTrigger />
      </div>

      <section className="mt-2 min-h-0 flex-1 overflow-hidden tablet:mt-3">

        <VerticalScroll containerClassName="h-full">

          <ActivityLogPageContent />

        </VerticalScroll>

      </section>

    </main>

  )

}