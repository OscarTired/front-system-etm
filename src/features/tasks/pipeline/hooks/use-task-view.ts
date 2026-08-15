"use client"

import { useCallback } from "react"
import { useRouter, usePathname, useSearchParams } from "next/navigation"
import type { TaskView } from "../actions/task-view-toggle"

const DEFAULT_VIEW: TaskView = "card"

function isValidView(value: string | null): value is TaskView {
  return value === "card" || value === "kanban"
}

export function useTaskView() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const rawView = searchParams.get("view")
  const view: TaskView = isValidView(rawView) ? rawView : DEFAULT_VIEW

  const setView = useCallback((next: TaskView) => {
    if (!next) return
    const params = new URLSearchParams(searchParams.toString())
    params.set("view", next)
    router.replace(`${pathname}?${params.toString()}`, { scroll: false })
  }, [router, pathname, searchParams])

  return { view, setView }
}