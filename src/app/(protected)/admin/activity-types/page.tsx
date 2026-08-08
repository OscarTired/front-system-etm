"use client"

import {
  ActivityTypeActions,
} from "@/features/activity-log/components/actions/activity-type-actions"

import {
  ActivityTypesPageContent,
} from "@/features/activity-log/components/contents/activity-types-page-content"

import {
  usePageTitle,
} from "@/shared/responsive/navigation/hooks/use-page-title"

export default function ActivityTypesPage() {

  usePageTitle("Actividades")

  return (

    <main className="flex h-full flex-col bg-[#050505] px-4 pt-0 pb-5 text-white select-none tablet:px-8 tablet:pt-0 desktop:py-10">

      <header className="hidden desktop:flex flex-wrap items-center justify-between gap-4 mb-4">

        <div className="min-w-0 flex-1 items-center gap-2 flex">

          <h1 className="shrink-0 text-2xl font-bold tracking-widest">
            ACTIVIDADES
          </h1>

          <span className="h-1 w-1 shrink-0 rounded-full bg-neutral-700" />

          <p className="min-w-0 truncate text-sm text-neutral-500">
            Lista de actividades para la Bitácora
          </p>

        </div>

        <div className="shrink-0">

          <ActivityTypeActions />

        </div>

      </header>

      <div className="desktop:hidden">
        <ActivityTypeActions />
      </div>

      <ActivityTypesPageContent />

    </main>

  )

}