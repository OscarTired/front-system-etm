import type { EngineeringProcessCode } from "../constants/engineering-process-definitions"

export type EngineeringTaskStatus =
  | "QUEUE"
  | "PENDING"
  | "PROGRESS"
  | "COMPLETED"

export type EngineeringTask = {
  id: string
  taskNumber: number
  title: string
  projectId: string
  processCode: EngineeringProcessCode
  status: EngineeringTaskStatus
  assigneeId: string | null
  note: string | null
  position: number
  createdAt: string
  updatedAt: string
  project?: {
    id: string
    projectCode: string
    name: string
  }
  assignee?: {
    id: string
    name: string
    color: string
    icon: string
  } | null
}

export type CreateEngineeringTaskDto = {
  title: string
  projectId: string
  processCode: EngineeringProcessCode
  assigneeId?: string
  note?: string
}

export type UpdateEngineeringTaskDto = {
  title?: string
  processCode?: EngineeringProcessCode
  status?: EngineeringTaskStatus
  assigneeId?: string | null
  note?: string | null
}
