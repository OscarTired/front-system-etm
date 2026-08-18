"use client"

import { usePageTitle } from "@/shared/responsive/navigation/hooks/use-page-title"
import { CadWorkspacePanel } from "@/features/cad/components/cad-workspace-panel"

export default function CadPage() {
  usePageTitle("CAD")

  return (
    <main className="flex h-full min-h-0 flex-col bg-background px-3 pt-0 pb-2 text-foreground select-none tablet:px-4 desktop:px-5 desktop:pt-1 desktop:pb-3">
      <header className="mb-2 hidden shrink-0 flex-wrap items-center gap-2 desktop:flex">
        <h1 className="shrink-0 text-2xl font-bold tracking-widest">CAD</h1>
        <span className="h-1 w-1 shrink-0 rounded-full bg-neutral-700" />
        <p className="min-w-0 truncate text-sm text-muted-foreground">
          Plantillas paramétricas · DXF · Nesting
        </p>
      </header>

      <section className="flex min-h-0 w-full flex-1 flex-col">
        <CadWorkspacePanel />
      </section>
    </main>
  )
}
