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

  // Admin / permiso global: ve todas las áreas de frente, sin botón
  // "mostrar / expandir áreas". Supervisor puro sí elige subset.
  const hasGlobalManagementPermission = has(PermissionCode.ROLE_MANAGE)
  const isAdmin = hasGlobalManagementPermission
  const isSupervisor = user?.level === "SUPERVISOR" && !isAdmin

  const canChooseFreely = isSupervisor || isAdmin

  // Admin → siempre todas. Supervisor → las que eligió en store.
  // Operario → solo las suyas.
  const areas: ProcessCode[] =
    isOperarioWithArea
      ? operarioAreaCodes
      : isAdmin
        ? ALL_PROCESS_CODES
        : isSupervisor
          ? supervisorAreas
          : []

  return {
    areas,
    // Solo supervisor necesita el toggle de elegir áreas.
    // Admin las ve todas de frente (desktop + móvil).
    canChooseAreas: isSupervisor,
    isAdmin,
    supervisorAreas,
    setSupervisorAreas,
    allAreas: ALL_PROCESS_CODES,
    hasAreaPanel: isOperarioWithArea || canChooseFreely,
  }
}
