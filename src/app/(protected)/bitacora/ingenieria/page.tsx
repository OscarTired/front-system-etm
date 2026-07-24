"use client"

import { usePageTitle } from "@/shared/responsive/navigation/hooks/use-page-title"

import { VerticalScroll } from "@/shared/ui/vertical-scroll/vertical-scroll"

import { ActivityLogPageContent } from "@/features/activity-log/components/activity-log-page-content"
import { ActivityLogActions } from "@/features/activity-log/components/activity-log-actions"

// Calco de /bitacora (Producción) — mismo motor, mismo layout,
// única diferencia real es department="INGENIERIA" pasado a ambos
// hijos. El acceso ya está restringido en dos capas: el ítem de
// navegación no aparece para quien no sea de Ingeniería/Admin (ver
// navigation.ts + sidebar-navigation.tsx), y aunque alguien entrara
// directo por URL, el backend igual rechaza la lectura/escritura
// (ActivityLogService.assertEngineeringAccess) — esta página no
// hace ningún chequeo de rol propio, confía en esas dos capas.
export default function BitacoraIngenieriaPage() {

  usePageTitle("Bitácora de Ingeniería")

  return (

    <main className="flex flex-col bg-[#050505] px-4 pt-3 pb-5 text-white select-none tablet:h-full tablet:px-8 tablet:py-10">

      <header className="flex flex-wrap items-start justify-between gap-4">

        <div className="hidden min-w-0 flex-1 items-center gap-2 tablet:flex">

          <h1 className="shrink-0 text-xl font-bold tracking-widest tablet:text-2xl">
            BITÁCORA DE INGENIERÍA
          </h1>

          <span className="hidden h-1 w-1 shrink-0 rounded-full bg-neutral-700 tablet:block" />

          <p className="min-w-0 truncate text-sm text-neutral-500">
            Qué hiciste hoy, por franja horaria
          </p>

        </div>

        {/* Siempre montado: mismo motivo que en Projects/Tasks/Users
            /ActivityTypes — el FAB de mobile no se pintaría si
            quedara adentro de un padre con display:none. */}
        <div className="shrink-0">

          <ActivityLogActions department="INGENIERIA" />

        </div>

      </header>

      <section className="mt-2 min-h-0 flex-1 overflow-hidden tablet:mt-3">

        <VerticalScroll containerClassName="h-full">

          <ActivityLogPageContent department="INGENIERIA" />

        </VerticalScroll>

      </section>

    </main>

  )

}