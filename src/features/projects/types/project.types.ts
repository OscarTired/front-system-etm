import type { Client } from "@/features/clients/types/client.types"
import type { User } from "@/features/users/types/user.types"
import type { Stage } from "@/features/stages/types/stage.types"
import type { Status } from "@/features/statuses/types/status.types"

export interface Project{

  id:string

  sequence:number

  projectCode:string

  name:string

  deliveryDate:string|null

  position:number

  createdById:string

  updatedById:string

  deletedAt:string|null

  createdAt:string

  updatedAt:string

  client:Client

  pm:User

  stage:Stage

  status:Status

  /** Comentarios activos (viene del listado, no requiere GET /comments). */
  commentCount?: number

}