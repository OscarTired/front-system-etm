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

  const hasGlobalManagementPermission = has(PermissionCode.ROLE_MANAGE)
  const isAdmin = hasGlobalManagementPermission
  const isSupervisor = user?.level === "SUPERVISOR"
  const canChooseFreely = isSupervisor || isAdmin

  // Operario → solo las suyas.
  // Admin/supervisor → selección del store; si está vacío, TODAS de frente
  // (no hace falta abrir el selector para "mostrar" áreas).
  // El selector sigue disponible para filtrar.
  const areas: ProcessCode[] = isOperarioWithArea
    ? operarioAreaCodes
    : canChooseFreely
      ? supervisorAreas.length > 0
        ? supervisorAreas
        : ALL_PROCESS_CODES
      : []

  return {
    areas,
    canChooseAreas: canChooseFreely,
    isAdmin,
    supervisorAreas,
    setSupervisorAreas,
    allAreas: ALL_PROCESS_CODES,
    hasAreaPanel: isOperarioWithArea || canChooseFreely,
  }
}
