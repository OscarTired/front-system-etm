import type { ActivityDepartment } from "../types/activity-log.types"

export type BitacoraDepartmentConfig = {
  department: ActivityDepartment
  // Título de pestaña (usePageTitle) — sentence case.
  pageTitle: string
  // Encabezado visible en la página — el mock ya lo mostraba en
  // mayúsculas, se deja como string aparte en vez de transformar
  // pageTitle en runtime.
  heading: string
  subtitle: string
  // Roles (además de ADMIN, que siempre pasa) habilitados para esta
  // bitácora. Espejo de BITACORA_DEPARTMENT_ROLES en el backend
  // (activity-log/constants/bitacora-department-roles.ts) — si se
  // agrega un rol acá, hay que agregarlo también del otro lado, o
  // vuelve a pasar lo de PROYECTOS: el sidebar lo dejaba entrar pero
  // el backend tiraba 403.
  roles: readonly string[]
}

export const BITACORA_DEPARTMENTS: Record<ActivityDepartment, BitacoraDepartmentConfig> = {
  PRODUCCION: {
    department: "PRODUCCION",
    pageTitle: "Bitácora de Producción",
    heading: "BITÁCORA DE PRODUCCIÓN",
    subtitle: "Qué hiciste hoy",
    roles: ["PRODUCCION"],
  },
  INGENIERIA: {
    department: "INGENIERIA",
    pageTitle: "Bitácora de Ingeniería",
    heading: "BITÁCORA DE INGENIERÍA",
    subtitle: "Qué hiciste hoy",
    roles: ["INGENIERIA", "PROYECTOS"],
  },
}