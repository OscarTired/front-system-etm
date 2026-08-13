"use client"

import {
  Layers3,
} from "lucide-react"

import type {
  ProcessCode,
  Task,
} from "@/features/tasks/types/task.types"

import {
  PROCESS_DEFINITIONS,
} from "@/features/processes/constants/process-definitions"

import {
  getBadgeColors,
} from "@/shared/utils/badge-colors"
import { useThemeStore } from "@/shared/theme"

type Props = {
  processCode: ProcessCode
  tasks: Task[]
}

export function TaskPipelinePlaceholder({
  processCode,
  tasks,
}: Props) {
  // Re-render chips when theme toggles (getBadgeColors reads DOM class)
  useThemeStore(s => s.resolved)


  const process =
    PROCESS_DEFINITIONS[processCode]

  const badge =
    getBadgeColors(
      process.color,
      "subtle",
    )

  const pieces =
    tasks.reduce(
      (sum, task) => sum + task.pieces,
      0,
    )

  return (

    <div
      className="flex h-16 items-center justify-between rounded-xl bg-foreground/5 px-4"
    >

      <div className="flex items-center gap-3">

        <div
          className="flex h-9 w-9 items-center justify-center rounded-lg"
          style={{
            background: badge.background,
            color: badge.text,
          }}
        >

          <Layers3 size={18} />

        </div>

        <div>

          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">

            Piezas

          </p>

          <p
            className="text-lg font-bold"
            style={{
              color: badge.text,
            }}
          >

            {pieces}

          </p>

        </div>

      </div>

      <div className="border-l border-border pl-4 text-right">

        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">

          Tareas

        </p>

        <p
          className="text-lg text-left font-bold"
          style={{
            color: badge.text,
          }}
        >

          {tasks.length}

        </p>

      </div>

    </div>

  )

}