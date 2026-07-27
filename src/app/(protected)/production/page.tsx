"use client"

import { useMemo, useState } from "react"

import { useTasks } from "@/features/tasks/hooks/use-tasks"
import { getWorkflowStep } from "@/features/workflow/selectors/get-workflow-step"

import { PROCESS_DEFINITIONS } from "@/features/processes/constants/process-definitions"
import { PIPELINE_PROCESS_ORDER } from "@/features/tasks/pipeline/utils/process-columns"

import { ProductionProcessCard } from "@/features/processes/components/production-hub/production-process-card"
import { ProductionHubSkeleton } from "@/features/processes/components/production-hub/production-hub-skeleton"

import { usePageTitle } from "@/shared/responsive/navigation/hooks/use-page-title"

import type { ProcessTask } from "@/features/processes/types/process.types"

export default function ProductionPage() {

  usePageTitle("Producción")

  const { tasks, loading } = useTasks()

  const [expandedCode, setExpandedCode] = useState<string | null>(null)

  const byProcess = useMemo(() => {

    const map = new Map<
      string,
      { processTasks: ProcessTask[]; urgentCount: number }
    >()

    for (const code of PIPELINE_PROCESS_ORDER) {

      const processTasks: ProcessTask[] = tasks

        .filter((task) => task.route.includes(code))

        .map((task) => ({
          task,
          workflowStep: getWorkflowStep(task, code) ?? null,
          paintStep: getWorkflowStep(task, "PT") ?? null,
          inputQuantity: null,
        }))
        .filter((pt) => pt.workflowStep?.status !== "REVIEWED")

      const urgentCount = processTasks.filter(
        (pt) => pt.task.priority.code === "URGENTE",
      ).length

      map.set(code, { processTasks, urgentCount })

    }

    return map

  }, [tasks])

  return (

    <main className="flex flex-col bg-[#050505] px-4 pt-0 pb-5 text-white select-none tablet:px-8 tablet:pt-0 desktop:py-10 tablet:h-full">

      <header className="hidden flex-wrap items-center justify-between gap-4 mb-4 desktop:flex">

        <div className="flex min-w-0 flex-1 items-center gap-2">

          <h1 className="shrink-0 text-2xl font-bold tracking-widest">
            PRODUCCIÓN
          </h1>

          <span className="h-1 w-1 shrink-0 rounded-full bg-neutral-700" />

          <p className="min-w-0 truncate text-sm text-neutral-500">
            Un vistazo rápido a cada proceso
          </p>

        </div>

      </header>

      <section className="mt-2 flex-1 min-h-0 tablet:mt-6">

        {loading ? (

          <ProductionHubSkeleton />

        ) : (

          <div className="flex flex-col gap-2 pb-4">

            {PIPELINE_PROCESS_ORDER.map((code) => {

              const definition = PROCESS_DEFINITIONS[code]
              const data = byProcess.get(code)

              return (

                <ProductionProcessCard
                  key={code}
                  definition={definition}
                  processTasks={data?.processTasks ?? []}
                  urgentCount={data?.urgentCount ?? 0}
                  expanded={expandedCode === code}
                  onToggle={() =>
                    setExpandedCode((current) =>
                      current === code ? null : code,
                    )
                  }
                />

              )

            })}

          </div>

        )}

      </section>

    </main>

  )

}