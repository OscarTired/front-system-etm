"use client"

import { create } from "zustand"
import { persist } from "zustand/middleware"

import type { ProcessCode } from "@/features/tasks/types/task.types"

type SupervisorAreasStore = {

  supervisorAreas: ProcessCode[]

  setSupervisorAreas: (
    areas: ProcessCode[]
  ) => void

}

// Antes esto era un useState inicializado leyendo localStorage una
// sola vez al montar, con un setter que también escribía a mano —
// funcionaba para un solo componente montado, pero si dos
// componentes distintos llaman al hook al mismo tiempo (ej. la
// pantalla de Asignación y el sheet "Mis tareas" abiertos juntos en
// desktop), cada uno tenía su PROPIA copia del estado, sin
// enterarse de los cambios del otro hasta recargar. Un store real
// (con persist, mismo patrón que ya usan sort-store/filter-store)
// notifica a TODOS los suscriptores en cuanto uno cambia el valor,
// sin importar cuántos componentes lo estén usando a la vez.
export const useSupervisorAreasStore =
  create<SupervisorAreasStore>()(

    persist(

      set => ({

        supervisorAreas: [],

        setSupervisorAreas: areas =>
          set({
            supervisorAreas: areas,
          }),

      }),

      {
        // Key nueva, no la vieja ("supervisor:areas" a secas) — el
        // formato viejo era un array JSON plano escrito a mano,
        // zustand/persist envuelve el estado distinto y no lo
        // leería bien. Es solo una preferencia de UI así que perder
        // la selección previa una vez (el usuario la vuelve a
        // elegir) no tiene costo real.
        name: "prod-erp-supervisor-areas",
      },

    ),

  )