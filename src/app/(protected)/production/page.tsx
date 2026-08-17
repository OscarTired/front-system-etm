"use client"

import { usePageTitle } from "@/shared/responsive/navigation/hooks/use-page-title"
import { TaskAreaSidebar } from "@/features/tasks/pipeline/components/panel/task-area-sidebar"

export default function AssignmentPage() {
  usePageTitle("Asignación")

  return (
    <main className="relative flex h-full min-h-0 flex-col bg-background px-3 pt-0 pb-2 text-foreground select-none tablet:px-4 desktop:px-5 desktop:pt-1 desktop:pb-3">
      {/* Header Desktop Limpio */}
      <header className="mb-1 hidden shrink-0 flex-wrap items-center justify-between gap-2 desktop:flex">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <h1 className="shrink-0 text-2xl font-bold tracking-widest">
            ASIGNACIÓN
          </h1>
          <span className="h-1 w-1 shrink-0 rounded-full bg-muted-foreground/50" />
          <p className="min-w-0 truncate text-sm text-muted-foreground">
            Convocá operarios a las tareas de cada área
          </p>
        </div>
      </header>

      {/* Contenedor Principal / Sidebar */}
      <TaskAreaSidebar className="flex-1" />
    </main>
  )
}