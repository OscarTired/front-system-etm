"use client"

import { ActivityTypeActions } from "@/features/activity-log/components/actions/activity-type-actions"
import { ActivityTypesPageContent } from "@/features/activity-log/components/contents/activity-types-page-content"
import { usePageTitle } from "@/shared/responsive/navigation/hooks/use-page-title"

export default function ActivityTypesPage() {
  usePageTitle("Actividades")

  return (
    <main className="flex h-full min-h-0 flex-col bg-background px-3 pt-0 pb-2 text-foreground select-none tablet:px-4 desktop:px-5 desktop:pt-1 desktop:pb-3">
      <header className="mb-1 hidden shrink-0 flex-wrap items-center justify-between gap-2 desktop:flex">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <h1 className="shrink-0 text-2xl font-bold tracking-widest">
            ACTIVIDADES
          </h1>
          <span className="h-1 w-1 shrink-0 rounded-full bg-muted-foreground/50" />
          <p className="min-w-0 truncate text-sm text-muted-foreground">
            Lista de actividades para la Bitácora
          </p>
        </div>
        <div className="shrink-0">
          <ActivityTypeActions />
        </div>
      </header>

      <div className="mb-1 shrink-0 desktop:hidden">
        <ActivityTypeActions />
      </div>

      <section className="flex min-h-0 w-full flex-1 flex-col">
        <ActivityTypesPageContent />
      </section>
    </main>
  )
}