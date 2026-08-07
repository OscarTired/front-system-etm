"use client"

import dynamic from "next/dynamic"
import { usePageTitle } from "@/shared/responsive/navigation/hooks/use-page-title"
import { NestingPageSkeleton } from "@/features/nesting/components/nesting-page-skeleton"

const NestingWorkspace = dynamic(
  () =>
    import("@/features/nesting/components/nesting-page").then((m) => m.NestingPage),
  {
    ssr: false,
    loading: () => <NestingPageSkeleton />,
  },
)

/**
 * Contrato mobile (ruta immersive — ver immersive-routes.ts):
 * el shell entrega un slot con altura real; este page lo llena con
 * `absolute inset-0`. Sin eso el canvas colapsa al alto del contenido.
 */
export default function NestingRoute() {
  usePageTitle("Nesting")

  return (
    <main className="absolute inset-0 overflow-hidden bg-[#050505] text-white select-none desktop:static desktop:relative desktop:h-full desktop:px-8 desktop:py-10">
      <header className="mb-4 hidden shrink-0 flex-wrap items-center justify-between gap-4 desktop:flex">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <h1 className="shrink-0 text-2xl font-bold tracking-widest">NESTING</h1>
          <span className="h-1 w-1 shrink-0 rounded-full bg-neutral-700" />
          <p className="min-w-0 truncate text-sm text-neutral-500">
            Acomodo de piezas en plancha
          </p>
        </div>
      </header>

      <section className="absolute inset-0 desktop:static desktop:h-full desktop:min-h-0">
        <NestingWorkspace />
      </section>
    </main>
  )
}
