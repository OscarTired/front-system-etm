"use client"

import { useEffect, useState } from "react"
import { ArrowLeft } from "lucide-react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"

import { useHydrated } from "@/shared/hooks/use-hydrated"

const STORAGE_KEY = "process-origin-task-id"

function readOrigin(): string | null {
  if (typeof sessionStorage === "undefined") return null
  return sessionStorage.getItem(STORAGE_KEY)
}

export function BackToTaskButton() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const hydrated = useHydrated()
  const [taskId, setTaskId] = useState<string | null>(null)

  // Re-leer cuando cambia la URL o se limpia el origen (consumo deep-link).
  useEffect(() => {
    if (!hydrated) return
    setTaskId(readOrigin())

    const onCleared = () => setTaskId(null)
    window.addEventListener("entity-origin-cleared", onCleared)
    return () => window.removeEventListener("entity-origin-cleared", onCleared)
  }, [hydrated, pathname, searchParams])

  if (!taskId) return null

  const handleClick = () => {
    sessionStorage.removeItem(STORAGE_KEY)
    setTaskId(null)
    router.push(`/tasks?taskId=${taskId}`)
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className="flex h-8 min-w-0 items-center gap-2 rounded-xl bg-white/5 px-4 text-sm font-medium text-neutral-300 transition-colors hover:bg-white/10 hover:text-white select-none"
    >
      <ArrowLeft className="h-4 w-4 shrink-0" />
      <span className="min-w-0 truncate whitespace-nowrap">Tarea</span>
    </button>
  )
}
