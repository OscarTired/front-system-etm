import type { ActivityDepartment } from "../types/activity-log.types"
import { BITACORA_DEPARTMENT_ROLE_CODES } from "@/shared/core/constants/department-roles"

export type BitacoraDepartmentConfig = {
  department: ActivityDepartment
  pageTitle: string
  mobileTitle?: string
  heading: string
  subtitle: string
  roles: readonly string[]
}

export const BITACORA_DEPARTMENTS: Record<ActivityDepartment, BitacoraDepartmentConfig> = {
  PRODUCCION: {
    department: "PRODUCCION",
    pageTitle: "Bitácora de Producción",
    mobileTitle: "Bitácora",
    heading: "BITÁCORA DE PRODUCCIÓN",
    subtitle: "Qué hiciste hoy",
    roles: [...BITACORA_DEPARTMENT_ROLE_CODES.PRODUCCION],
  },
  INGENIERIA: {
    department: "INGENIERIA",
    pageTitle: "Bitácora de Ingeniería",
    mobileTitle: "Bitácora",
    heading: "BITÁCORA DE INGENIERÍA",
    subtitle: "Qué hiciste hoy",
    roles: [...BITACORA_DEPARTMENT_ROLE_CODES.INGENIERIA],
  },
}