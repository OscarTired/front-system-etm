export type DayShift =
  | "MORNING_1"
  | "MORNING_2"
  | "LUNCH"
  | "AFTERNOON_1"
  | "AFTERNOON_2"
  | "NIGHT"

export interface ActivityType {
  id: string
  code: string | null
  label: string
  icon: string
  color: string
  order: number
  active: boolean
  // Data-driven: true = siempre visible como botón directo en el
  // picker. false = agrupado dentro de "Otros". Se administra desde
  // la pantalla de tipos de actividad, nada de esto vive hardcodeado
  // en el componente del picker.
  pinned: boolean
  department: ActivityDepartment
}

export interface ActivityLogProjectRef {
  id: string
  name: string
  projectCode: string
}

export interface ActivityLogTaskRef {
  id: string
  taskNumber: number
  reference: string
}

export interface ActivityLogUserRef {
  id: string
  name: string
  color: string
  icon: string
}

export type ActivityLogSource =
  | "MANUAL"
  | "AUTO"

export type ActivityDepartment =
  | "PRODUCCION"
  | "INGENIERIA"

export interface ActivityLog {
  id: string
  userId: string
  activityTypeId: string
  projectId: string | null
  taskId: string | null
  note: string | null
  photoUrl: string | null
  // Nullable: los registros AUTO (al completar una tarea) no
  // pertenecen a ninguna franja horaria manual.
  shift: DayShift | null
  source: ActivityLogSource
  loggedAt: string
  activityType: ActivityType
  project: ActivityLogProjectRef | null
  task: ActivityLogTaskRef | null
  // Solo viene poblado en la vista de supervisión del equipo
  // (getAll) — los demás endpoints ya están scoped al usuario actual.
  user?: ActivityLogUserRef
}

export interface CreateActivityLogDto {
  activityTypeId: string
  projectId?: string
  taskId?: string
  // Franja elegida a mano en el picker — si no viene, el backend
  // cae a calcularla por la hora real (ver
  // ActivityLogService.create()).
  shift?: DayShift
  note?: string
  // Data URI (resultado de FileReader.readAsDataURL) — mismo
  // mecanismo que CommentComposer.
  photoBase64?: string
}

export interface CreateActivityTypeDto {
  label: string
  icon: string
  color: string
  order?: number
  pinned?: boolean
}

export interface UpdateActivityLogDto {
  shift?: DayShift
  activityTypeId?: string
  projectId?: string
  taskId?: string | null
  note?: string | null
}

export interface UpdateActivityTypeDto {
  label?: string
  icon?: string
  color?: string
  order?: number
  active?: boolean
  pinned?: boolean
}