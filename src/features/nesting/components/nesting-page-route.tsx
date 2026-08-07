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

export default function NestingRoute() {
  usePageTitle("Nesting")

  return (
    <div className="h-full w-full min-h-0 bg-[#050505] text-white select-none">
      <header className="mb-4 hidden shrink-0 flex-wrap items-center justify-between gap-4 px-8 desktop:flex desktop:pt-6">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <h1 className="shrink-0 text-2xl font-bold tracking-widest">NESTING</h1>
          <span className="h-1 w-1 shrink-0 rounded-full bg-neutral-700" />
          <p className="min-w-0 truncate text-sm text-neutral-500">
            Acomodo de piezas en plancha
          </p>
        </div>
      </header>
      <div className="h-full min-h-0 w-full desktop:px-8 desktop:pb-6">
        <NestingWorkspace />
      </div>
    </div>
  )
}
