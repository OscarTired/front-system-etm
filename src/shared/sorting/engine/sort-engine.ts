import type { Task } from "@/features/tasks/types/task.types"
import type { Project } from "@/features/projects/types/project.types"
import type {
  TaskSortMode,
  ProjectSortMode,
  SortDirection,
} from "@/shared/sorting/store/sort-store"

const PRIORITY_ORDER = {
  URGENTE: 0,
  ALTA: 1,
  MEDIA: 2,
  BAJA: 3,
} as const

type TaskViewParams<T> = {
  base: T[]
  mode: TaskSortMode
  direction?: SortDirection
  getTask?: (item: T) => Task
}

export function createTaskView<T extends Task>(params: {
  base: T[]
  mode: TaskSortMode
  direction?: SortDirection
}): T[]

export function createTaskView<T>(params: {
  base: T[]
  mode: TaskSortMode
  direction?: SortDirection
  getTask: (item: T) => Task
}): T[]

export function createTaskView<T>({
  base,
  mode,
  direction = "asc",
  getTask,
}: TaskViewParams<T>): T[] {
  if (mode === "manual") return base

  const extract = getTask ?? ((item: T) => item as unknown as Task)
  const dir = direction === "desc" ? -1 : 1
  const view = [...base]

  if (mode === "delivery") {
    return view.sort(
      (a, b) =>
        dir * (toTime(extract(a).deliveryDate) - toTime(extract(b).deliveryDate)),
    )
  }

  if (mode === "sequence") {
    return view.sort(
      (a, b) => dir * (extract(a).taskNumber - extract(b).taskNumber),
    )
  }

  if (mode === "code") {
    return view.sort(
      (a, b) =>
        dir *
        compareProjectCode(
          extract(a).project.projectCode,
          extract(b).project.projectCode,
        ),
    )
  }

  // priority (default): URGENTE → BAJA; empate por entrega
  return view.sort((a, b) => {
    const taskA = extract(a)
    const taskB = extract(b)

    const priorityA =
      PRIORITY_ORDER[taskA.priority.code as keyof typeof PRIORITY_ORDER] ?? 99
    const priorityB =
      PRIORITY_ORDER[taskB.priority.code as keyof typeof PRIORITY_ORDER] ?? 99

    const diff = priorityA - priorityB
    if (diff !== 0) return dir * diff

    return dir * (toTime(taskA.deliveryDate) - toTime(taskB.deliveryDate))
  })
}

type ProjectViewParams = {
  base: Project[]
  mode: ProjectSortMode
  direction?: SortDirection
}

export function createProjectView({
  base,
  mode,
  direction = "asc",
}: ProjectViewParams): Project[] {
  if (mode === "manual") return base

  const dir = direction === "desc" ? -1 : 1
  const view = [...base]

  if (mode === "delivery") {
    return view.sort(
      (a, b) => dir * (toTime(a.deliveryDate) - toTime(b.deliveryDate)),
    )
  }

  if (mode === "code") {
    return view.sort(
      (a, b) => dir * compareProjectCode(a.projectCode, b.projectCode),
    )
  }

  // sequence
  return view.sort((a, b) => dir * (a.sequence - b.sequence))
}

function parseProjectCode(code: string) {
  const match = code.match(/^(\d{2})-(\d{3})-(?:M|E|EM)$/)
  if (!match) return { year: 0, num: 0 }
  return {
    year: parseInt(match[1], 10),
    num: parseInt(match[2], 10),
  }
}

function compareProjectCode(a: string, b: string) {
  const pa = parseProjectCode(a)
  const pb = parseProjectCode(b)
  if (pa.year !== pb.year) return pa.year - pb.year
  return pa.num - pb.num
}

function toTime(date?: string | null) {
  return date ? new Date(date).getTime() : Number.MAX_SAFE_INTEGER
}
