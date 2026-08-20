"use client"

import { useState } from "react"
import { Sparkles, Boxes } from "lucide-react"
import { usePageTitle } from "@/shared/responsive/navigation/hooks/use-page-title"
import { CadWorkspacePanel } from "@/features/cad/components/cad-workspace-panel"
import { CadAiPanel } from "@/features/cad-ai/components/cad-ai-panel"

type Tab = "ai" | "templates"

export default function CadPage() {
  usePageTitle("CAD")
  const [tab, setTab] = useState<Tab>("ai")

  return (
    <main className="flex h-full min-h-0 flex-col bg-background px-3 pt-0 pb-2 text-foreground select-none tablet:px-4 desktop:px-5 desktop:pt-1 desktop:pb-3">
      <header className="mb-2 hidden shrink-0 flex-wrap items-center gap-2 desktop:flex">
        <h1 className="shrink-0 text-2xl font-bold tracking-widest">CAD</h1>
        <span className="h-1 w-1 shrink-0 rounded-full bg-neutral-700" />
        <p className="min-w-0 truncate text-sm text-muted-foreground">
          IA · Plantillas paramétricas · DXF · Nesting
        </p>
      </header>

      <div className="mb-2 flex shrink-0 items-center gap-1 rounded-lg border border-border bg-card p-1">
        <button
          onClick={() => setTab("ai")}
          className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
            tab === "ai" ? "bg-primary text-primary-foreground" : "text-foreground hover:bg-secondary"
          }`}
        >
          <Sparkles className="w-4 h-4" />
          IA
        </button>
        <button
          onClick={() => setTab("templates")}
          className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
            tab === "templates" ? "bg-primary text-primary-foreground" : "text-foreground hover:bg-secondary"
          }`}
        >
          <Boxes className="w-4 h-4" />
          Plantillas
        </button>
      </div>

      <section className="flex min-h-0 w-full flex-1 flex-col">
        {tab === "ai" ? <CadAiPanel /> : <CadWorkspacePanel />}
      </section>
    </main>
  )
}
