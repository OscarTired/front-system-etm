"use client"

import { useRouter } from "next/navigation"
import { ChevronDown } from "lucide-react"

import { ENTITY_ICONS } from "@/shared/constants/entity-icons"
import { getBadgeColors } from "@/shared/utils/badge-colors"
import { useThemeStore } from "@/shared/theme"
import { cn } from "@/shared/utils/utils"

import { TaskPipelineCardCompact } from "@/features/tasks/pipeline/components/cards/task-pipeline-card-compact"

import type { ProcessDefinition } from "../../constants/process-definitions"
import type { ProcessTask } from "../../types/process.types"

type Props = {
  definition: ProcessDefinition
  processTasks: ProcessTask[]
  urgentCount: number
  expanded: boolean
  onToggle: () => void
}

// Colapsada: mismo lenguaje visual que el resumen de KpiCarousel
// (fondo degradado con el color del proceso, ícono en caja, label,
// métricas). Expandida: lista compacta de sus tareas, reutilizando
// TaskPipelineCardCompact (sin overlay — es un vistazo rápido, el
// trabajo real se hace en la página individual del proceso).
export function ProductionProcessCard({
  definition,
  processTasks,
  urgentCount,
  expanded,
  onToggle,
}: Props) {
  // Re-render chips when theme toggles (getBadgeColors reads DOM class)
  useThemeStore(s => s.resolved)


  const router = useRouter()

  const Icon = ENTITY_ICONS[definition.icon]
  const textColor = getBadgeColors(definition.color, "subtle").text

  const total = processTasks.length

  const urgentColor =
    urgentCount === 0
      ? "text-muted-foreground"
      : urgentCount <= 2
        ? "text-amber-400"
        : "text-red-400"

  function handleOpenTask(taskId: string) {
    router.push(`/processes?code=${definition.code.toLowerCase()}&taskId=${taskId}`)
  }

  return (

    <div className="overflow-hidden rounded-2xl">

      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center gap-3 p-3 text-left transition hover:brightness-110 tablet:gap-4"
        style={{
          background: `linear-gradient(135deg, ${definition.color}20, var(--process-card-end, var(--process-card-end)))`,
        }}
      >

        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-foreground/5">

          {Icon && <Icon size={20} style={{ color: textColor }} />}

        </div>

        <span
          className="shrink-0 text-xs font-bold uppercase tracking-[0.18em]"
          style={{ color: textColor }}
        >
          {definition.code}
        </span>

        <div className="flex min-w-0 flex-1 items-center justify-end gap-4 tablet:gap-8">

          <div className="min-w-0 text-right">

            <p className="truncate text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">
              Total
            </p>

            <p
              className="text-lg font-bold leading-tight"
              style={{ color: textColor }}
            >
              {total}
            </p>

          </div>

          <div className="h-8 w-px shrink-0 bg-foreground/10" />

          <div className="min-w-0 text-right">

            <p className="truncate text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">
              Urgentes
            </p>

            <p
              className={cn(
                "text-lg font-bold leading-tight transition-colors duration-300",
                urgentColor,
              )}
            >
              {urgentCount}
            </p>

          </div>

        </div>

        <ChevronDown
          size={18}
          className={cn(
            "shrink-0 text-muted-foreground transition-transform duration-200",
            expanded && "rotate-180",
          )}
        />

      </button>

      {expanded && (

        <div className="animate-comment-in flex flex-col gap-2 bg-foreground/5 p-2 pt-3">

          {processTasks.length === 0 && (

            <div className="flex h-12 items-center justify-center rounded-xl bg-foreground/5 text-sm text-muted-foreground">
              Sin tareas en {definition.label}
            </div>

          )}

          {processTasks.map((processTask) => (

            <div
              key={processTask.task.id}
              onClick={() => handleOpenTask(processTask.task.id)}
              className="cursor-pointer"
            >

              <TaskPipelineCardCompact processTask={processTask} />

            </div>

          ))}

        </div>

      )}

    </div>

  )

}