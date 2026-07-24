"use client"

import { useCallback } from "react"
import { useRouter, usePathname, useSearchParams } from "next/navigation"
import { useResponsive } from "@/shared/responsive/hooks/use-responsive"
import type { TaskView } from "../actions/task-view-toggle"

const DEFAULT_VIEW: TaskView = "card"

function isValidView(value: string | null): value is TaskView {
  return value === "card" || value === "kanban" || value === "tabla"
}

export function useTaskView() {
  const { isMobile } = useResponsive()
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const rawView = searchParams.get("view")
  const urlView: TaskView = isValidView(rawView) ? rawView : DEFAULT_VIEW

  const setView = useCallback((next: TaskView) => {
    if (!next) return
    const params = new URLSearchParams(searchParams.toString())
    params.set("view", next)
    router.replace(`${pathname}?${params.toString()}`, { scroll: false })
  }, [router, pathname, searchParams])

  const view: TaskView = isMobile ? DEFAULT_VIEW : urlView

  return { view, setView }
}