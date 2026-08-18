"use client"

import { EngineeringPageContent } from "@/features/engineering/components/engineering-page-content"
import { usePageTitle } from "@/shared/responsive/navigation/hooks/use-page-title"

export default function IngenieriaPage() {
  usePageTitle("Ingeniería")

  return (
    <main className="flex h-full min-h-0 flex-col bg-background px-3 pt-0 pb-2 text-foreground select-none tablet:px-4 desktop:px-5 desktop:pt-1 desktop:pb-3">
      <header className="mb-1 hidden shrink-0 flex-wrap items-center justify-between gap-2 desktop:flex">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <h1 className="shrink-0 text-2xl font-bold tracking-widest">
            INGENIERÍA
          </h1>
          <span className="h-1 w-1 shrink-0 rounded-full bg-muted-foreground/50" />
          <p className="min-w-0 truncate text-sm text-muted-foreground">
            Tareas y asignación de diseño
          </p>
        </div>
        <div aria-hidden className="h-10 w-10 shrink-0" />
      </header>

      <section className="flex min-h-0 w-full flex-1 flex-col">
        <EngineeringPageContent />
      </section>
    </main>
  )
}
