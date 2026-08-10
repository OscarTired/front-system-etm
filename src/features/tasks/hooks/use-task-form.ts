"use client"

import { useState, useEffect, useRef } from "react"
import { useProjects } from "@/features/projects/hooks/use-projects"
import { useTasks } from "./use-tasks"
import type { Task, ProcessCode } from "../types/task.types"

export interface TaskFormValue {
  projectId: string
  reference: string
  lotNumber: number
  pieces: number
  assemblyCount: number
  paintKg: number
  route: ProcessCode[]
  priorityId: string
  materialId: string
  thicknessId: string
  colorId: string | null
  plRt: string | null
  deliveryDate: string
}

export function useTaskForm(initialTask?: Task, initialProjectId?: string) {
  const { projects = [] } = useProjects()
  const { tasks = [] } = useTasks()

  const [form, setForm] = useState<TaskFormValue>({
    projectId: initialProjectId || initialTask?.project?.id || "",
    reference: initialTask?.reference || "",
    lotNumber: initialTask?.lotNumber || 1,
    pieces: initialTask?.pieces || 1,
    assemblyCount: initialTask?.assemblyCount || 0,
    paintKg: initialTask?.paintKg || 0,
    route: initialTask?.route || [],
    priorityId: initialTask?.priority?.id || "",
    materialId: initialTask?.material?.id || "",
    thicknessId: initialTask?.thickness?.id || "",
    colorId: initialTask?.color?.id || null,
    plRt: initialTask?.plRt || null,
    // DatePicker/parseISODate solo aceptan "YYYY-MM-DD"
    deliveryDate: initialTask?.deliveryDate
      ? initialTask.deliveryDate.slice(0, 10)
      : "",
  })

  // Sincronización reactiva del proyecto y su fecha de entrega por defecto
  const activeProjectId = initialProjectId || form.projectId

  // Seed fecha desde proyecto solo en create / cambio de proyecto.
  // En edit conservamos la fecha de la tarea (ya normalizada arriba).
  const prevProjectIdRef = useRef<string | null>(null)

  useEffect(() => {
    if (!activeProjectId || projects.length === 0) return

    const selectedProject = projects.find((p) => p.id === activeProjectId)
    if (!selectedProject?.deliveryDate) return

    const formattedDate = selectedProject.deliveryDate.split("T")[0]
    const prev = prevProjectIdRef.current
    prevProjectIdRef.current = activeProjectId

    setForm((prevForm) => {
      const next = { ...prevForm, projectId: activeProjectId }

      if (initialTask) {
        // Edición: nunca pisar la fecha de la tarea
        return next
      }

      if (prev === null) {
        // Primer mount create: seed solo si aún no hay fecha
        if (!prevForm.deliveryDate) next.deliveryDate = formattedDate
        return next
      }

      if (prev !== activeProjectId) {
        // Usuario cambió de proyecto → fecha del nuevo proyecto
        next.deliveryDate = formattedDate
      }

      return next
    })
  }, [activeProjectId, projects, initialTask])

  // Sugerencia automática de Lote: al elegir/cambiar de proyecto en
  // una tarea NUEVA, se propone max(lote de las tareas existentes
  // de ese proyecto) + 1 — sigue siendo editable, es solo el punto
  // de partida. Se guarda en un ref qué proyecto ya recibió su
  // sugerencia para no pisarla de nuevo si el efecto se vuelve a
  // ejecutar por otro motivo (ej. la lista de tasks se refresca en
  // segundo plano) sin que la persona haya cambiado de proyecto.
  const lastSuggestedProjectId = useRef<string | null>(null)

  useEffect(() => {

    if (initialTask) return
    if (!activeProjectId) return
    if (lastSuggestedProjectId.current === activeProjectId) return

    lastSuggestedProjectId.current = activeProjectId

    const lotsInProject = tasks
      .filter(t => t.project.id === activeProjectId)
      .map(t => t.lotNumber)

    const nextLot = lotsInProject.length > 0
      ? Math.max(...lotsInProject) + 1
      : 1

    setForm(prev => ({
      ...prev,
      lotNumber: nextLot,
    }))

  }, [activeProjectId, tasks, initialTask])

  const update = (fields: Partial<TaskFormValue>) => {
    setForm((prev) => ({ ...prev, ...fields }))
  }

  const reset = () => {
    setForm({
      projectId: initialProjectId || "",
      reference: "",
      lotNumber: 1,
      pieces: 1,
      assemblyCount: 0,
      paintKg: 0,
      route: [],
      priorityId: "",
      materialId: "",
      thicknessId: "",
      colorId: null,
      plRt: null,
      deliveryDate: "",
    })
  }

  const buildTask = () => ({
    projectId: form.projectId,
    reference: form.reference,
    lotNumber: Number(form.lotNumber),
    pieces: Number(form.pieces),
    assemblyCount: Number(form.assemblyCount),
    paintKg: Number(form.paintKg),
    route: form.route,
    priorityId: form.priorityId,
    materialId: form.materialId,
    thicknessId: form.thicknessId,
    colorId: form.colorId || null,
    plRt: form.plRt || null,
    deliveryDate: form.deliveryDate || null,
  })

  const canSave = Boolean(
    form.projectId &&
    form.reference.trim() &&
    form.route.length > 0 &&
    form.deliveryDate &&
    form.priorityId &&
    form.materialId &&
    form.thicknessId
  )

  return {
    form,
    update,
    reset,
    buildTask,
    canSave,
  }
}