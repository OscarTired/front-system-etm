import type { Client } from "@/features/clients/types/client.types"
import type { User } from "@/features/users/types/user.types"
import type { Stage } from "@/features/stages/types/stage.types"
import type { Status } from "@/features/statuses/types/status.types"
import type { Priority } from "@/features/priorities/types/priority.types"
import type { Material } from "@/features/materials/types/material.types"
import type { Thickness } from "@/features/thicknesses/types/thickness.types"
import type { Color } from "@/features/colors/types/color.types"
import type { WorkflowStep } from "@/features/workflow/types/workflow.types"

export type ProcessCode =
  | "CT"
  | "PL"
  | "SD"
  | "PT"
  | "EN"
  | "DS"

export interface TaskProject{

  id:string
  sequence:number
  projectCode:string
  name:string

  deliveryDate:string | null

  client:Client
  pm:User
  stage:Stage
  status:Status

}

export interface Task{

  id:string

  taskNumber:number

  reference:string

  pieces:number
  lotNumber:number

  assemblyCount:number
  paintKg:number

  route:ProcessCode[]

  plRt:string | null

  deliveryDate:string | null

  position:number

  createdById:string
  updatedById:string

  deletedAt:string | null

  createdAt:string
  updatedAt:string

  project:TaskProject

  priority:Priority

  material:Material

  thickness:Thickness

  color:Color | null

  workflowSteps:WorkflowStep[]

  /** Comentarios activos de la tarea (listado). */
  commentCount?: number

}