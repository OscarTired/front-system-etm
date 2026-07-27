"use client"

import { useSearchParams } from "next/navigation"

import {
  ProcessPageContent,
} from "@/features/processes/components/process-page-content"

import {
  getProcessDefinition,
} from "@/features/processes/selectors/get-process-definition"

import type {
  ProcessCode,
} from "@/features/tasks/types/task.types"

import { usePageTitle } from "@/shared/responsive/navigation/hooks/use-page-title"

export default function ProcessPage() {

  const searchParams =
    useSearchParams()

  const taskId =
    searchParams.get("taskId") ?? undefined

  const focusToken =
    searchParams.get("focus") ?? undefined

  const initialShowHistory =
    searchParams.get("history") === "1"

  const codeParam =
    searchParams.get("code") ?? "ct"

  const processCode =
    codeParam.toUpperCase() as ProcessCode

  const process =
    getProcessDefinition(
      processCode,
    )

  usePageTitle(process?.label ?? "Proceso")

  return (

    <main className="flex flex-col bg-[#050505] px-4 pt-0 pb-5 text-white select-none tablet:px-8 tablet:pt-0 desktop:py-10 tablet:h-full">

      <header className="hidden flex-wrap items-center justify-between gap-4 mb-4 desktop:flex">

        <div className="flex min-w-0 flex-1 items-center gap-2">

          <h1 className="shrink-0 text-2xl font-bold tracking-widest">

            {process?.label.toUpperCase()}

          </h1>

          <span className="h-1 w-1 shrink-0 rounded-full bg-neutral-700" />

          <p className="min-w-0 truncate text-sm text-neutral-500">

            Centro de gestión del proceso

          </p>

        </div>

        <div
          aria-hidden
          className="h-10 w-10 shrink-0"
        />

      </header>

      <section className="mt-2 min-h-0 flex-1 tablet:mt-3">

        <ProcessPageContent
          processCode={processCode}
          focusedTaskId={taskId}
          focusToken={focusToken}
          initialShowHistory={initialShowHistory}
        />

      </section>

    </main>

  )

}