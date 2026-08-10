"use client"

import { useMemo } from "react"

import { normalizeSearch } from "@/shared/utils/search"

import type { Project } from "../types/project.types"

/** Match por código completo o por segmentos (ej. "144" → "26-144-EM"). */
function matchesCodeOrParts(term: string, code: string): boolean {
  const n = normalizeSearch(code)
  if (!n) return false
  if (n.includes(term)) return true
  const parts = n.split(/[-_/.\s]+/).filter(Boolean)
  return parts.some(
    p => p === term || p.startsWith(term) || term.startsWith(p),
  )
}

export function useProjectSearch(projects: Project[], search: string) {
  return useMemo(() => {
    const term = normalizeSearch(search)

    if (!term) return projects

    // Numérico de 1 dígito también (antes exigía 2 y devolvía []).
    if (!/^\d+$/.test(term) && term.length < 2) {
      return []
    }

    const isNumeric = /^\d+$/.test(term)

    return projects.filter(project => {
      const sequence = String(project.sequence ?? "")
      const sequencePadded = sequence.padStart(3, "0")

      if (isNumeric) {
        if (
          sequence === term ||
          sequencePadded === term ||
          sequence.padStart(term.length, "0") === term
        ) {
          return true
        }
        // "144" encuentra 26-144-…
        return matchesCodeOrParts(term, project.projectCode ?? "")
      }

      const projectCode = normalizeSearch(project.projectCode ?? "")
      const projectName = normalizeSearch(project.name ?? "")
      const client = normalizeSearch(project.client?.name ?? "")
      const pm = normalizeSearch(project.pm?.name ?? "")

      return (
        matchesCodeOrParts(term, project.projectCode ?? "") ||
        projectCode.includes(term) ||
        projectName.includes(term) ||
        client.includes(term) ||
        pm.includes(term)
      )
    })
  }, [projects, search])
}
