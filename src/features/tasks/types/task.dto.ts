import type {
  ProcessCode,
} from "./task.types"

export interface CreateTaskDto {

  projectId:string

  reference:string

  pieces:number

  lotNumber:number

  assemblyCount:number

  paintKg:number

  route:ProcessCode[]

  priorityId:string

  materialId?:string

  thicknessId?:string

  materials?: Array<{
    materialId: string
    thicknessId: string
    pieces: number
  }>

  colorId?:string | null

  plRt?:string | null

  deliveryDate?:string | null

}

export interface UpdateTaskDto {

  projectId?:string

  reference?:string

  pieces?:number

  lotNumber?:number

  assemblyCount?:number

  paintKg?:number

  route?:ProcessCode[]

  priorityId?:string

  materialId?:string

  thicknessId?:string

  colorId?:string | null

  plRt?:string | null

  deliveryDate?:string | null

}