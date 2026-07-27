// Debe reflejar EXACTAMENTE las keys de `handlers` en
// realtime-registry.ts. En runtime esto no se valida (el registry
// hace `event.entity as keyof typeof handlers`, un cast sin chequeo
// real) — este union es la única red de seguridad en tiempo de
// compilación, así que una entidad que quede afuera acá pero exista
// en `handlers` (o viceversa) no explota, pero pierde todo el
// autocomplete/type-checking, y como documentación queda mintiendo.
export type RealtimeEntity=
  |"PROJECT"
  |"TASK"
  |"WORKFLOW"
  |"PROCESS"
  |"USER"
  |"NOTIFICATION"
  |"CLIENT"
  |"COMMENT"
  |"COMMENT_READ_STATUS"
  |"COLOR"
  |"MATERIAL"
  |"PRIORITY"
  |"STAGE"
  |"STATUS"
  |"THICKNESS"
  |"ROLE_PERMISSIONS"
  |"ACTIVITY_LOG"

export type RealtimeAction=
  |"CREATED"
  |"UPDATED"
  |"BULK_READ"  
  |"DELETED"
  |"DELETED_ALL"
  |"REORDERED"  

export interface RealtimeEvent{

  entity:RealtimeEntity

  action:RealtimeAction

  id:string

  payload?:unknown

  timestamp?:number

}