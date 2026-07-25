"use client"

import { ArrowRight } from "lucide-react"

import { ENTITY_ICONS } from "@/shared/constants/entity-icons"
import { PROCESS_DEFINITIONS } from "@/features/processes/constants/process-definitions"
import type { ProcessCode, Task } from "@/features/tasks/types/task.types"
import { getBadgeColors } from "@/shared/utils/badge-colors"
import { TaskPipelineCard } from "../components/cards/task-pipeline-card"
import { TaskColumnOperator } from "../components/tasks/task-column-operator"
import { useColumnScroll } from "../hooks/use-column-scroll"
import { getTaskProcesses } from "../utils/get-task-process"
import { getNextIncludedProcess } from "../utils/get-next-process"
import { useResponsive } from "@/shared/responsive/hooks/use-responsive"
import { cn } from "@/lib/utils"

type SharedProps = {
  processCode: ProcessCode
  tasks: Task[]
  allTasks?: Task[]
}

type ContentProps = SharedProps & {
  expandedKey: string | null
  onToggleCard: (key: string) => void
  activeOverlayKey: string | null
  onOverlayOpenChange: (key: string, isOpen: boolean) => void
}

function ColumnHeader({
  processCode,
  tasks,
  fullWidth,
}: SharedProps & { fullWidth?: boolean }) {
  const definition = PROCESS_DEFINITIONS[processCode]
  const Icon = ENTITY_ICONS[definition.icon]
  const badge = getBadgeColors(definition.color, "subtle")

  return (
    <div className={cn("shrink-0", fullWidth ? "w-full" : "w-72")}>
      <header
        className="flex items-center gap-2 border-b px-3 py-3"
        style={{ borderColor: definition.color }}
      >
        <span
          className="flex size-6 items-center justify-center rounded-md text-xs font-bold"
          style={{ color: badge.text, backgroundColor: badge.background }}
        >
          {processCode}
        </span>

        {Icon && (
          <Icon size={15} style={{ color: definition.color }} />
        )}

        <span className="text-sm font-bold uppercase tracking-wide text-neutral-200">
          {definition.label}
        </span>

        <span className="ml-auto text-xs font-semibold text-neutral-500">
          {tasks.length}
        </span>
      </header>

      <div className="border-b border-white/5 px-2 py-1">
        <TaskColumnOperator
          processCode={processCode}
          tasks={tasks}
        />
      </div>
    </div>
  )
}

function ColumnContent({
  processCode,
  tasks,
  allTasks,
  expandedKey,
  onToggleCard,
  activeOverlayKey,
  onOverlayOpenChange,
  fullWidth,
}: ContentProps & { fullWidth?: boolean }) {
  const { isMobile } = useResponsive()
  const columnScrollRef = useColumnScroll()

  const rows = allTasks
    ? allTasks.map(task => ({
        task,
        included: getTaskProcesses(task).includes(processCode),
      }))
    : tasks.map(task => ({ task, included: true }))

  return (
    <div className={cn(
      "flex shrink-0 flex-col",
      isMobile || fullWidth ? "w-full" : "h-full w-72 overflow-hidden",
    )}>
      <div
        ref={isMobile || fullWidth ? undefined : columnScrollRef}
        style={isMobile ? undefined : { touchAction: "pan-y" }}
        className={cn(
          "hide-scrollbar overflow-x-hidden px-2 py-2",
          isMobile || fullWidth
            ? ""
            : "min-h-0 flex-1 overflow-y-auto overscroll-contain cursor-grab active:cursor-grabbing",
        )}
      >
        <div className="flex flex-col gap-2 pb-2">
          {rows.map(({ task, included }) => {
            const key = `${task.id}:${processCode}`

            if (!included) {
              const nextProcess =
                getNextIncludedProcess(task, processCode)

              const nextDefinition =
                nextProcess
                  ? PROCESS_DEFINITIONS[nextProcess]
                  : null

              const NextIcon =
                nextDefinition
                  ? ENTITY_ICONS[nextDefinition.icon]
                  : null

              const nextBadge =
                nextDefinition
                  ? getBadgeColors(nextDefinition.color, "subtle")
                  : null

              return (
                <div
                  key={key}
                  className="flex h-12 shrink-0 items-center justify-end rounded-xl bg-white/4 px-3 opacity-50"
                >
                  <span className="flex w-4 shrink-0 items-center justify-center">
                    {nextDefinition && (
                      <ArrowRight
                        size={13}
                        strokeWidth={2.75}
                        className="text-neutral-600"
                      />
                    )}
                  </span>

                  {nextDefinition && nextBadge ? (
                    <span
                      className="ml-1.5 inline-flex shrink-0 items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-bold"
                      style={{
                        color: nextBadge.text,
                        backgroundColor: nextBadge.background,
                      }}
                    >
                      {NextIcon && <NextIcon size={15} />}
                      <span>{nextProcess}</span>
                    </span>
                  ) : null}
                </div>
              )
            }

            return (
              <TaskPipelineCard
                key={key}
                task={task}
                processCode={processCode}
                expanded={expandedKey === key}
                onToggle={() => onToggleCard(key)}
                overlayLocked={activeOverlayKey !== null && activeOverlayKey !== key}
                onOverlayOpenChange={(isOpen) => onOverlayOpenChange(key, isOpen)}
              />
            )
          })}

          {rows.length === 0 && (
            <div className="flex h-12 items-center justify-center rounded-xl bg-white/4 px-3 text-sm font-medium text-neutral-500">
              Sin tareas
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

type Props = SharedProps & {
  expandedKey: string | null
  onToggleCard: (key: string) => void
  activeOverlayKey: string | null
  onOverlayOpenChange: (key: string, isOpen: boolean) => void
  onCreateTask?: () => void
  headerOnly?: boolean
  contentOnly?: boolean
  fullWidth?: boolean
}

export function TaskProcessColumn({
  processCode,
  tasks,
  allTasks,
  expandedKey,
  onToggleCard,
  activeOverlayKey,
  onOverlayOpenChange,
  headerOnly = false,
  contentOnly = false,
  fullWidth = false,
}: Props) {
  if (headerOnly) {
    return <ColumnHeader processCode={processCode} tasks={tasks} fullWidth={fullWidth} />
  }

  if (contentOnly) {
    return (
      <ColumnContent
        processCode={processCode}
        tasks={tasks}
        allTasks={allTasks}
        expandedKey={expandedKey}
        onToggleCard={onToggleCard}
        activeOverlayKey={activeOverlayKey}
        onOverlayOpenChange={onOverlayOpenChange}
        fullWidth={fullWidth}
      />
    )
  }

  return (
    <section
      className={cn(
        "flex h-full min-h-0 shrink-0 flex-col overflow-hidden",
        fullWidth ? "w-full" : "w-72",
      )}
    >
      <ColumnHeader processCode={processCode} tasks={tasks} fullWidth={fullWidth} />
      <ColumnContent
        processCode={processCode}
        tasks={tasks}
        allTasks={allTasks}
        expandedKey={expandedKey}
        onToggleCard={onToggleCard}
        activeOverlayKey={activeOverlayKey}
        onOverlayOpenChange={onOverlayOpenChange}
        fullWidth={fullWidth}
      />
    </section>
  )
}