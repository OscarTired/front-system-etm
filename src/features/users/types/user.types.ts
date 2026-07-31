import { EntityIcon } from "@/shared/constants/entity-icons"

export interface UserRole {

  id:string

  code:string

  name:string

  icon:EntityIcon

  color:string

  active:boolean

}

export interface UserArea {

  id:string

  code:string

  label:string

  processCode:string | null

}

export interface User{

  id:string

  username:string | null

  name:string

  email:string

  icon:EntityIcon

  color:string

  active:boolean

  online:boolean

  // Cuándo se desconectó del todo por última vez — null si nunca
  // se conectó, o si está online ahora mismo no hace falta mirarlo
  // (el panel de Activos usa "online" para eso).
  lastSeenAt:string | null

  avatarUrl:string | null

  phone:string | null

  position:string | null

  deletedAt:string | null

  createdAt:string

  updatedAt:string

  // Array ahora (m2m) — un usuario puede tener más de un rol a la
  // vez (ej. Ingeniería + Proyectos), sumando los permisos de
  // todos (antes era 1 a 1, role:UserRole).
  roles:UserRole[]

  level:"GENERAL" | "OPERARIO" | "SUPERVISOR" | null

  // Array ahora (m2m) — un operario puede pertenecer a más de un
  // área a la vez (antes era 1 a 1, area:UserArea|null).
  areas:UserArea[]

}