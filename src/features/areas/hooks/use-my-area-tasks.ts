"use client"

import { useAuthStore } from "@/features/auth/store/auth-store"
import { useSupervisorAreasStore } from "@/features/areas/store/supervisor-areas-store"

import type { ProcessCode } from "@/features/tasks/types/task.types"
import type { User } from "@/features/users/types/user.types"

const ALL_PROCESS_CODES: ProcessCode[] = ["CT", "PL", "SD", "PT", "EN", "DS"]

function isProcessCode(value: string): value is ProcessCode {
  return (ALL_PROCESS_CODES as string[]).includes(value)
}

// Resuelve qué área(s) le corresponden al panel lateral según el
// Perfil del usuario (Rol + Nivel + Área):
// - OPERARIO con área(s) fija(s) asignada(s) (User.areas) → esas,
//   fijas, no elegibles por el usuario (puede ser más de una).
// - SUPERVISOR o ADMIN → elige libremente qué área(s) ver (guardado
//   en localStorage, es una preferencia de UI, no un permiso — ver
//   plan: "configurable por usuario"). Admin entra acá con el mismo
//   criterio que ya tiene en el resto de la app (ve todo, sin
//   restricción de área fija).
// - Cualquier otro caso (GENERAL sin ser Admin, sin área, o rol sin
//   sentido para esto) → sin áreas, el panel no debería ni
//   mostrarse (ver hasAreaPanel más abajo).
export function useMyAreaTasks() {

  const user = useAuthStore(state => state.user) as User | null

  const supervisorAreas = useSupervisorAreasStore(state => state.supervisorAreas)
  const setSupervisorAreas = useSupervisorAreasStore(state => state.setSupervisorAreas)

  // Antes era "!!user.area?.processCode" (una sola). Ahora un
  // OPERARIO puede tener varias áreas fijas a la vez — alcanza con
  // que tenga AL MENOS una con processCode válido.
  const operarioAreaCodes: ProcessCode[] =
    (user?.areas ?? [])
      .map(area => area.processCode)
      .filter((code): code is ProcessCode => !!code && isProcessCode(code))

  const isOperarioWithArea =
    user?.level === "OPERARIO" && operarioAreaCodes.length > 0

  const isAdmin = user?.roles?.some(role => role.code === "ADMIN") ?? false

  // Supervisor y Admin comparten el mismo mecanismo de selección
  // libre — Admin no tiene un "área fija" más que nadie, así que no
  // tiene sentido darle un comportamiento distinto acá.
  const canChooseFreely = user?.level === "SUPERVISOR" || isAdmin

  const areas: ProcessCode[] =
    isOperarioWithArea
      ? operarioAreaCodes
      : canChooseFreely
        ? supervisorAreas
        : []

  return {
    areas,
    // Solo quien elige libremente puede editar la selección — el
    // operario ve su área fija, asignada desde su Perfil, no algo
    // que edite acá.
    canChooseAreas: canChooseFreely,
    supervisorAreas,
    setSupervisorAreas,
    allAreas: ALL_PROCESS_CODES,
    // Si no aplica ninguno de los casos, ni vale la pena ofrecer el
    // panel (ver trigger).
    hasAreaPanel: isOperarioWithArea || canChooseFreely,
  }

}