"use client"

import { useState } from "react"

import { useAuthStore } from "@/features/auth/store/auth-store"

import type { ProcessCode } from "@/features/tasks/types/task.types"
import type { User } from "@/features/users/types/user.types"

const STORAGE_KEY = "supervisor:areas"

const ALL_PROCESS_CODES: ProcessCode[] = ["CT", "PL", "SD", "PT", "EN", "DS"]

function isProcessCode(value: string): value is ProcessCode {
  return (ALL_PROCESS_CODES as string[]).includes(value)
}

function getStoredSupervisorAreas(): ProcessCode[] {

  if (typeof window === "undefined") {
    return []
  }

  try {

    const raw = window.localStorage.getItem(STORAGE_KEY)

    if (!raw) {
      return []
    }

    const parsed = JSON.parse(raw)

    if (!Array.isArray(parsed)) {
      return []
    }

    return parsed.filter(
      (value): value is ProcessCode =>
        typeof value === "string" && isProcessCode(value),
    )

  } catch {
    return []
  }

}

// Resuelve qué área(s) le corresponden al panel lateral según el
// Perfil del usuario (Rol + Nivel + Área):
// - OPERARIO con área fija asignada (User.area) → esa sola, fijo,
//   no elegible por el usuario.
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

  const [supervisorAreas, setSupervisorAreasState] =
    useState<ProcessCode[]>(getStoredSupervisorAreas)

  function setSupervisorAreas(next: ProcessCode[]) {

    setSupervisorAreasState(next)

    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
    } catch {
      // Preferencia de UI nomás — si no se puede persistir, sigue
      // andando en memoria por esta sesión.
    }

  }

  const isOperarioWithArea =
    user?.level === "OPERARIO" && !!user.area?.processCode

  const isAdmin = user?.role?.code === "ADMIN"

  // Supervisor y Admin comparten el mismo mecanismo de selección
  // libre — Admin no tiene un "área fija" más que nadie, así que no
  // tiene sentido darle un comportamiento distinto acá.
  const canChooseFreely = user?.level === "SUPERVISOR" || isAdmin

  const areas: ProcessCode[] =
    isOperarioWithArea
      ? [user!.area!.processCode as ProcessCode]
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