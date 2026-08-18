"use client"

import { useEffect, useState } from "react"
import { ArrowLeft } from "lucide-react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"

import { useHydrated } from "@/shared/hooks/use-hydrated"
import { useFocusNavStore } from "@/shared/focus/store/focus-nav-store"
import { PROCESS_DEFINITIONS } from "@/features/processes/constants/process-definitions"
import type { ProcessCode } from "@/features/tasks/types/task.types"

/** Origen al navegar proceso → proceso (chip QUEUE / hub). */
export const PROCESS_ORIGIN_CODE_KEY = "process-origin-code"
export const PROCESS_ORIGIN_TASK_KEY = "process-origin-task-id"

function readOriginCode(): string | null {
  if (typeof sessionStorage === "undefined") return null
  return sessionStorage.getItem(PROCESS_ORIGIN_CODE_KEY)
}

function readOriginTask(): string | null {
  if (typeof sessionStorage === "undefined") return null
  return sessionStorage.getItem(PROCESS_ORIGIN_TASK_KEY)
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

    const onCleared = () => setOriginCode(null)
    window.addEventListener("entity-origin-cleared", onCleared)
    return () => window.removeEventListener("entity-origin-cleared", onCleared)
  }, [hydrated, pathname, searchParams])

  if (!originCode) return null

  const code = originCode.toUpperCase() as ProcessCode
  const def = PROCESS_DEFINITIONS[code]
  const label = def?.label ?? code

  const handleClick = () => {
    const taskId = readOriginTask()
    sessionStorage.removeItem(PROCESS_ORIGIN_CODE_KEY)
    sessionStorage.removeItem(PROCESS_ORIGIN_TASK_KEY)
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
