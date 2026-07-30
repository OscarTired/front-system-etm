"use client"

import { useAuthStore } from "@/features/auth/store/auth-store"
import { useSupervisorAreasStore } from "@/features/areas/store/supervisor-areas-store"
import { usePermissions } from "@/features/permissions/hooks/use-permissions"
import { PermissionCode } from "@/shared/core/enums/permission-code.enum"

import type { ProcessCode } from "@/features/tasks/types/task.types"
import type { User } from "@/features/users/types/user.types"

const ALL_PROCESS_CODES: ProcessCode[] = ["CT", "PL", "SD", "PT", "EN", "DS"]

function isProcessCode(value: string): value is ProcessCode {
  return (ALL_PROCESS_CODES as string[]).includes(value)
}

export function useMyAreaTasks() {
  const user = useAuthStore(state => state.user) as User | null
  const { has } = usePermissions()

  const supervisorAreas = useSupervisorAreasStore(state => state.supervisorAreas)
  const setSupervisorAreas = useSupervisorAreasStore(state => state.setSupervisorAreas)

  const operarioAreaCodes: ProcessCode[] =
    (user?.areas ?? [])
      .map(area => area.processCode)
      .filter((code): code is ProcessCode => !!code && isProcessCode(code))

  const isOperarioWithArea =
    user?.level === "OPERARIO" && operarioAreaCodes.length > 0

  // Cero hardcode: Validamos de forma limpia y escalable mediante permisos 
  // del sistema (ej: gestión total de roles o administración global)
  const hasGlobalManagementPermission = has(PermissionCode.ROLE_MANAGE)

  const canChooseFreely = user?.level === "SUPERVISOR" || hasGlobalManagementPermission

  const areas: ProcessCode[] =
    isOperarioWithArea
      ? operarioAreaCodes
      : canChooseFreely
        ? supervisorAreas
        : []

  return {
    areas,
    canChooseAreas: canChooseFreely,
    // Admin ve TODO (incluida la pantalla de Asignación dedicada),
    // pero a diferencia de un Supervisor "puro" no tiene por qué
    // perder el acceso rápido a "Mis tareas" — un Supervisor sí
    // usa la pantalla de Asignación en vez de este trigger (ver
    // TaskAreaPanelTrigger), pero para Admin ambos caminos tienen
    // sentido a la vez.
    isAdmin: hasGlobalManagementPermission,
    supervisorAreas,
    setSupervisorAreas,
    allAreas: ALL_PROCESS_CODES,
    hasAreaPanel: isOperarioWithArea || canChooseFreely,
  }
}