"use client"

import { useEffect, useState } from "react"
import { ArrowLeft } from "lucide-react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"

import { useHydrated } from "@/shared/hooks/use-hydrated"
import { useFocusNavStore } from "@/shared/focus/store/focus-nav-store"
import { PROCESS_DEFINITIONS } from "@/features/processes/constants/process-definitions"
import type { ProcessCode } from "@/features/tasks/types/task.types"

/** Origen proceso→proceso. Exclusivo vs process-origin-task-id (← Tarea). */
export const PROCESS_ORIGIN_CODE_KEY = "process-origin-code"
/** taskId a re-enfocar al volver al proceso (NO es la clave de ← Tarea). */
export const PROCESS_ORIGIN_FOCUS_TASK_KEY = "process-origin-focus-task-id"
/** Clave de ← Tarea — se limpia al navegar proceso→proceso. */
export const BACK_TO_TASK_ORIGIN_KEY = "process-origin-task-id"

function readOriginCode(): string | null {
  if (typeof sessionStorage === "undefined") return null
  return sessionStorage.getItem(PROCESS_ORIGIN_CODE_KEY)
}

function readFocusTask(): string | null {
  if (typeof sessionStorage === "undefined") return null
  return sessionStorage.getItem(PROCESS_ORIGIN_FOCUS_TASK_KEY)
}

/** Guarda origen de navegación entre procesos y cancela ← Tarea. */
export function setProcessNavigationOrigin(
  fromCode: ProcessCode,
  taskId: string,
) {
  if (typeof sessionStorage === "undefined") return
  sessionStorage.setItem(PROCESS_ORIGIN_CODE_KEY, fromCode)
  sessionStorage.setItem(PROCESS_ORIGIN_FOCUS_TASK_KEY, taskId)
  // Un solo back: proceso cancela tarea.
  sessionStorage.removeItem(BACK_TO_TASK_ORIGIN_KEY)
  window.dispatchEvent(new Event("entity-origin-cleared"))
  // Re-avisar para que BackToProcess relea (cleared solo vacía state;
  // el efecto también depende de pathname/searchParams al navegar).
}

export function BackToProcessButton() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const hydrated = useHydrated()
  const [originCode, setOriginCode] = useState<string | null>(null)

  useEffect(() => {
    if (!hydrated) return
    setOriginCode(readOriginCode())

    const onCleared = () => setOriginCode(readOriginCode())
    window.addEventListener("entity-origin-cleared", onCleared)
    return () => window.removeEventListener("entity-origin-cleared", onCleared)
  }, [hydrated, pathname, searchParams])

  if (!originCode) return null

  const code = originCode.toUpperCase() as ProcessCode
  const def = PROCESS_DEFINITIONS[code]
  const label = def?.label ?? code

  const handleClick = () => {
    const taskId = readFocusTask()
    sessionStorage.removeItem(PROCESS_ORIGIN_CODE_KEY)
    sessionStorage.removeItem(PROCESS_ORIGIN_FOCUS_TASK_KEY)
    setOriginCode(null)
    useFocusNavStore.getState().start(`Abriendo ${label}…`)
    const qs = new URLSearchParams()
    qs.set("code", code.toLowerCase())
    if (taskId) qs.set("taskId", taskId)
    router.push(`/processes?${qs.toString()}`)
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className="flex h-8 min-w-0 items-center gap-2 rounded-xl bg-foreground/5 px-4 text-sm font-medium text-muted-foreground transition-colors hover:bg-foreground/10 hover:text-foreground select-none"
    >
      <ArrowLeft className="h-4 w-4 shrink-0" />
      <span className="min-w-0 truncate whitespace-nowrap">{label}</span>
    </button>
  )
}
