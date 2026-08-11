import type {
  TaskFormValue,
} from "../../hooks/use-task-form"

export type TaskFormErrors = Partial<
  Record<
    | "projectId"
    | "reference"
    | "lotNumber"
    | "route"
    | "deliveryDate"
    | "priorityId"
    | "materialId"
    | "thicknessId"
    | "pieces"
    | "assemblyCount"
    | "colorId"
    | "paintKg",
    string
  >
>

export type TaskFormSectionProps = {
  form: TaskFormValue

  update: (
    data: Partial<TaskFormValue>
  ) => void

  projectLocked?: boolean

  routeLocked?: boolean
  lockedRouteCodes?: import("@/features/tasks/types/task.types").ProcessCode[]

  errors?: TaskFormErrors
}