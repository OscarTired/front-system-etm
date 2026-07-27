"use client"

import { useSearchParams } from "next/navigation"

import { TaskActions } from "@/features/tasks/components/actions/task-actions"

import {
  TaskPageContent,
} from "@/features/tasks/components/task-page-content"

import { usePageTitle } from "@/shared/responsive/navigation/hooks/use-page-title"

export default function TasksPage() {

  usePageTitle("Tareas")

  const searchParams =
    useSearchParams()

  const taskId =
    searchParams.get("taskId") ?? undefined

  const focusToken =
    searchParams.get("focus") ?? undefined

  const initialShowHistory =
    searchParams.get("history") === "1"

  return (

    <main className="flex flex-col bg-[#050505] px-4 pt-0 pb-5 text-white select-none tablet:px-8 tablet:pt-0 desktop:py-10 tablet:h-full">

      <header className="hidden desktop:flex flex-wrap items-center justify-between gap-4 mb-4">

        {/*
          Título y descripción en la misma línea (items-baseline),
          separados por un punto — en vez de título arriba +
          descripción en su propia línea debajo. Eso liberaba una
          línea entera de alto que en mobile competía con el
          espacio del pipeline. min-w-0 + truncate en la descripción
          para que en pantallas angostas se corte en vez de forzar
          un wrap que vuelva a sumar altura.
        */}
        <div className="min-w-0 flex-1 items-center gap-2 flex">

          <h1 className="shrink-0 text-2xl font-bold tracking-widest">
            TAREAS
          </h1>

          <span className="h-1 w-1 shrink-0 rounded-full bg-neutral-700" />

          <p className="min-w-0 truncate text-sm text-neutral-500">
            Gestión de tareas y procesos
          </p>

        </div>

        <div className="shrink-0">
          <TaskActions />
        </div>

      </header>

      {/* Siempre montado para que el FAB funcione correctamente en mobile */}
      <div className="desktop:hidden">
        <TaskActions />
      </div>

      <section className="mt-2 flex-1 min-h-0 tablet:mt-3">

        <TaskPageContent
          focusedTaskId={taskId}
          focusToken={focusToken}
          initialShowHistory={initialShowHistory}
        />

      </section>

    </main>

  )

}