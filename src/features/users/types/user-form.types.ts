import type {
  EntityIcon,
} from "@/shared/constants/entity-icons"

export interface UserForm{

  username:string

  name:string

  email:string

  roleIds:string[]

  level?:"GENERAL" | "OPERARIO" | "SUPERVISOR" | null

  // Faltaba por completo — se me había pasado en la migración de
  // áreas (esta interfaz es la que usa el service/mutation, no la
  // vi en esa vuelta).
  areaIds?:string[]

  icon:EntityIcon

  color:string

  active:boolean

}