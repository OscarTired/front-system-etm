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

  area:UserArea | null

}