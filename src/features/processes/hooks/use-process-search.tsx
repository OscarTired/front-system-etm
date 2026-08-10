"use client"

import { useMemo } from "react"

import { normalizeSearch } from "@/shared/utils/search"

import { processAccess } from "../access/process-access"

import type { ProcessTask } from "../types/process.types"

function matchesCodeOrParts(term: string, code: string): boolean {
  const n = normalizeSearch(code)
  if (!n) return false
  if (n.includes(term)) return true
  const parts = n.split(/[-_/.\s]+/).filter(Boolean)
  return parts.some(
    p => p === term || p.startsWith(term) || term.startsWith(p),
  )
}

export function useProcessSearch(tasks: ProcessTask[], search: string) {
  return useMemo(() => {
    const term = normalizeSearch(search)

    if (!term) return tasks

    if (!/^\d+$/.test(term) && term.length < 2) {
      return []
    }

    const isNumeric = /^\d+$/.test(term)

    return tasks.filter(item => {
      const task = processAccess.task(item)
      const project = processAccess.project(item)
      const priority = processAccess.priority(item)

      const taskNumber = String(task.taskNumber ?? "")
      const taskNumberPadded = taskNumber.padStart(3, "0")
      const projectCode = project.projectCode ?? ""

      if (isNumeric) {
        if (
          taskNumber === term ||
          taskNumberPadded === term ||
          taskNumber.padStart(term.length, "0") === term
        ) {
          return true
        }
        if (matchesCodeOrParts(term, projectCode)) return true
        if (matchesCodeOrParts(term, task.reference ?? "")) return true
        return false
      }

      const reference = normalizeSearch(task.reference ?? "")
      const client = normalizeSearch(project.client?.name ?? "")
      const priorityName = normalizeSearch(priority.name ?? "")
      const projectName = normalizeSearch(project.name ?? "")

      return (
        matchesCodeOrParts(term, projectCode) ||
        matchesCodeOrParts(term, task.reference ?? "") ||
        reference.includes(term) ||
        client.includes(term) ||
        priorityName.includes(term) ||
        projectName.includes(term)
      )
    })
  }, [tasks, search])
}