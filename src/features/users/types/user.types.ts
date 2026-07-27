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

  avatarUrl:string | null

  phone:string | null

  position:string | null

  deletedAt:string | null

  createdAt:string

  updatedAt:string

  role:UserRole

  level:"GENERAL" | "OPERARIO" | "SUPERVISOR" | null

  // Array ahora (m2m) — un operario puede pertenecer a más de un
  // área a la vez (antes era 1 a 1, area:UserArea|null).
  areas:UserArea[]

}