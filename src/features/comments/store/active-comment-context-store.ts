"use client"

import { create } from "zustand"

import type { CommentTarget } from "@/features/comments/types/comment.types"

type Store = {
  activeTarget: CommentTarget | null
  setActiveTarget: (target: CommentTarget | null) => void
}

// A diferencia de sort-store/filter-store, esto NO se persiste — es
// literalmente "qué estás mirando ahora mismo en esta sesión", no
// una preferencia que tenga sentido guardar entre visitas.
export const useActiveCommentContextStore = create<Store>(set => ({
  activeTarget: null,
  setActiveTarget: target => set({ activeTarget: target }),
}))

// Se llama desde RealtimeProvider (fuera de React, por eso no usa
// el hook) para decidir si el toast de una notificación nueva debe
// suprimirse porque el usuario ya está mirando ese mismo hilo.
export function isViewingNotificationTarget(
  target: { taskId: string | null; projectId: string | null; workflowStepId: string | null },
): boolean {

  const active = useActiveCommentContextStore.getState().activeTarget

  if (!active) {
    return false
  }

  if (active.scope === "workflowStep") {
    return active.workflowStepId === target.workflowStepId
  }

  if (active.scope === "task") {
    return active.taskId === target.taskId
  }

  return active.projectId === target.projectId

}