"use client"

import { usePageTitle } from "@/shared/responsive/navigation/hooks/use-page-title"

import { VerticalScroll } from "@/shared/ui/vertical-scroll/vertical-scroll"

import { ActivityLogPageContent } from "@/features/activity-log/components/activity-log-page-content"

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

        {/* Espacio reservado invisible para mantener la alineación idéntica del layout con el botón primary */}
        <div className="invisible shrink-0 pointer-events-none select-none" aria-hidden="true">
          <div className="inline-flex h-10 items-center justify-center px-5 text-sm font-semibold">
            Placeholder
          </div>
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