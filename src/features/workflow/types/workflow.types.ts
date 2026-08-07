import type { ProcessCode } from "@/features/tasks/types/task.types"
import type { User } from "@/features/users/types/user.types"

export type WorkflowStatus=
  |"QUEUE"
  |"PENDING"
  |"PROGRESS"
  |"PAUSED"
  |"COMPLETED"
  |"REVIEWED"

export type WorkflowAction=
  |"start"
  |"pause"
  |"resume"
  |"complete"
  |"review"
  |"reopen"

export interface WorkflowStep{

  id:string

  taskId:string

  processCode:ProcessCode

  order:number

  status:WorkflowStatus

  operatorId:string | null

  operator:User | null

  // Quién puso a `operator` ahí vía "Convocar" (modo ASSIGN) — null
  // cuando el propio operario se autoasignó al iniciar. Separa
  // "Asignadas" de "Disponibles" en Mis tareas.
  assignedById:string | null

  // Invitación pendiente ("Convocar" modo INVITE) — operatorId
  // todavía NO se tocó, queda así hasta que el operario invitado la
  // acepte/rechace desde su propio Mis tareas. El backend solo manda
  // el id (no un User anidado) — para mostrar nombre/color se cruza
  // con useUsersDirectory en el frontend, igual que ya se hace en
  // otros lados con operatorId suelto.
  invitedOperatorId:string | null

  invitedById:string | null

  invitedAt:string | null

  startedAt:string | null

  completedAt:string | null

  reviewedAt:string | null

  piecesOutput:number | null

  plRtReal:number | null

  paintKgReal:number | null

  createdAt:string

  updatedAt:string

  commentCount?: number

}

export interface WorkflowHistoryEntry{

  id:string

  taskId:string

  workflowStepId:string

  processCode:ProcessCode

  action:WorkflowAction

  timestamp:string

}