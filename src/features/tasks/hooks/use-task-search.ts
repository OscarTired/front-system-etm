"use client"

import { useMemo } from "react"

import { normalizeSearch } from "@/shared/utils/search"

import type { Task } from "../types/task.types"

function matchesCodeOrParts(term: string, code: string): boolean {
  const n = normalizeSearch(code)
  if (!n) return false
  if (n.includes(term)) return true
  const parts = n.split(/[-_/.\s]+/).filter(Boolean)
  return parts.some(
    p => p === term || p.startsWith(term) || term.startsWith(p),
  )
}

export function useTaskSearch(tasks: Task[], search: string) {
  return useMemo(() => {
    const term = normalizeSearch(search)

    if (!term) return tasks

    if (!/^\d+$/.test(term) && term.length < 2) {
      return []
    }

    const isNumeric = /^\d+$/.test(term)

    return tasks.filter(task => {
      const taskNumber = String(task.taskNumber ?? "")
      const taskNumberPadded = taskNumber.padStart(3, "0")
      const projectCode = task.project?.projectCode ?? ""

      if (isNumeric) {
        if (
          taskNumber === term ||
          taskNumberPadded === term ||
          taskNumber.padStart(term.length, "0") === term
        ) {
          return true
        }
        // Número en código de proyecto o referencia
        if (matchesCodeOrParts(term, projectCode)) return true
        if (matchesCodeOrParts(term, task.reference ?? "")) return true
        return false
      }

      const reference = normalizeSearch(task.reference ?? "")
      const pCode = normalizeSearch(projectCode)
      const projectName = normalizeSearch(task.project?.name ?? "")
      const client = normalizeSearch(task.project?.client?.name ?? "")
      const pm = normalizeSearch(task.project?.pm?.name ?? "")
      const material = normalizeSearch(task.material?.name ?? "")
      const thickness = normalizeSearch(task.thickness?.name ?? "")
      const color = normalizeSearch(task.color?.name ?? "")

      return (
        matchesCodeOrParts(term, projectCode) ||
        matchesCodeOrParts(term, task.reference ?? "") ||
        reference.includes(term) ||
        pCode.includes(term) ||
        projectName.includes(term) ||
        client.includes(term) ||
        pm.includes(term) ||
        material.includes(term) ||
        thickness.includes(term) ||
        color.includes(term)
      )
    })
  }, [tasks, search])
}
