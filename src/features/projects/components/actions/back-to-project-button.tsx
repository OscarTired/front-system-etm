"use client"

import { useEffect, useState } from "react"
import { ArrowLeft } from "lucide-react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"

import { useHydrated } from "@/shared/hooks/use-hydrated"

const STORAGE_KEY = "task-origin-project-id"

function readOrigin(): string | null {
  if (typeof sessionStorage === "undefined") return null
  return sessionStorage.getItem(STORAGE_KEY)
}

export function BackToProjectButton() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const hydrated = useHydrated()
  const [projectId, setProjectId] = useState<string | null>(null)

  useEffect(() => {
    if (!hydrated) return
    setProjectId(readOrigin())

    const onCleared = () => setProjectId(null)
    window.addEventListener("entity-origin-cleared", onCleared)
    return () => window.removeEventListener("entity-origin-cleared", onCleared)
  }, [hydrated, pathname, searchParams])

  if (!projectId) return null

  const handleClick = () => {
    sessionStorage.removeItem(STORAGE_KEY)
    setProjectId(null)
    router.push(`/projects?projectId=${projectId}`)
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className="flex h-8 min-w-0 items-center gap-2 rounded-xl bg-white/5 px-4 text-sm font-medium text-neutral-300 transition-colors hover:bg-white/10 hover:text-white select-none"
    >
      <ArrowLeft className="h-4 w-4 shrink-0" />
      <span className="min-w-0 truncate whitespace-nowrap">Proyecto</span>
    </button>
  )
}
