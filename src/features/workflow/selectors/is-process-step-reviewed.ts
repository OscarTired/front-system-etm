import type { ProcessCode } from "@/features/tasks/types/task.types"
import type { WorkflowStep } from "../types/workflow.types"

// A diferencia de isWorkflowCompleted (que exige que TODA la ruta
// esté REVIEWED), esto responde una pregunta distinta: "¿el paso de
// ESTA área puntual ya se revisó?", sin que importe si a la tarea
// le queda ruta pendiente en otras áreas. Es lo que hace falta para
// tratar el historial dentro de una columna de proceso (ej. Mis
// tareas, TaskAreaPanel) — ahí "revisado" es un estado por área, no
// por tarea completa.
export function isProcessStepReviewed(
  workflow: WorkflowStep[] = [],
  processCode: ProcessCode,
) {

  const step = workflow.find(s => s.processCode === processCode)

  return step?.status === "REVIEWED"

}