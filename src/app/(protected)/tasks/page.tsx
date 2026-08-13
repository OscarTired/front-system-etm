"use client"

import { useSearchParams } from "next/navigation"

import { TaskActions } from "@/features/tasks/components/actions/task-actions"
import { TaskPageContent } from "@/features/tasks/components/task-page-content"
import { usePageTitle } from "@/shared/responsive/navigation/hooks/use-page-title"

export default function TasksPage() {
  usePageTitle("Tareas")

  const searchParams = useSearchParams()
  const taskId = searchParams.get("taskId") ?? undefined
  const focusToken = searchParams.get("focus") ?? undefined
  const initialShowHistory = searchParams.get("history") === "1"

  return (
    <main className="flex h-full min-h-0 flex-col bg-background px-3 pt-0 pb-2 text-foreground select-none tablet:px-4 desktop:px-5 desktop:pt-1 desktop:pb-3">
      <header className="mb-1 hidden shrink-0 flex-wrap items-center justify-between gap-2 desktop:flex">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <h1 className="shrink-0 text-2xl font-bold tracking-widest">
            TAREAS
          </h1>
          <span className="h-1 w-1 shrink-0 rounded-full bg-neutral-700" />
          <p className="min-w-0 truncate text-sm text-muted-foreground">
            Gestión de tareas
          </p>
        </div>
        <div className="shrink-0">
          <TaskActions />
        </div>
      </header>

      <section className="flex min-h-0 w-full flex-1 flex-col">
        <TaskPageContent
          focusedTaskId={taskId}
          focusToken={focusToken}
          initialShowHistory={initialShowHistory}
        />
      </section>
    </main>
  )
}