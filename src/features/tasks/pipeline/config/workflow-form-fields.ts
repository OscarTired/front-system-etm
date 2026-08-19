import type { ProcessCode } from "@/features/tasks/types/task.types"
import type { WorkflowFormVariant } from "@/features/tasks/pipeline/hooks/use-task-workflow-form"

export type WorkflowFieldType =
  | "operator"
  | "piecesOutput"
  | "plRtReal"
  | "paintKgReal"

// workflow-form-fields.ts
export const WORKFLOW_FORM_FIELDS: Record<
  WorkflowFormVariant,
  Partial<Record<ProcessCode, WorkflowFieldType[]>>
> = {
  start: {
    CT: ["operator"],
    PL: ["operator"],
    SD: ["operator"],
    PT: ["operator"],
    EN: ["operator"],
    DS: ["operator"],
  },
  complete: {
    CT: ["piecesOutput", "plRtReal"],
    PL: ["piecesOutput"],
    SD: ["piecesOutput"],
    PT: ["piecesOutput", "paintKgReal"],
    EN: ["piecesOutput"],
    DS: ["piecesOutput"],
  },
}