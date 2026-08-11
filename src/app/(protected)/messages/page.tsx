"use client"

import { MessagesPageContent } from "@/features/comments/components/messages-page-content"
import { usePageTitle } from "@/shared/responsive/navigation/hooks/use-page-title"

/**
 * Ruta sugerida: src/app/(protected)/messages/page.tsx
 * (ajusta el path al app router de tu repo)
 */
export default function MessagesPage() {
  usePageTitle("Mensajes")

  return (
    <main className="flex h-full min-h-0 flex-col bg-[#050505] px-3 pt-0 pb-2 text-white select-none tablet:px-4 desktop:px-5 desktop:pt-1 desktop:pb-3">
      <header className="mb-3 hidden shrink-0 flex-wrap items-center justify-between gap-2 desktop:flex">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <h1 className="shrink-0 text-2xl font-bold tracking-widest">
            MENSAJES
          </h1>
          <span className="h-1 w-1 shrink-0 rounded-full bg-neutral-700" />
          <p className="min-w-0 truncate text-sm text-neutral-500">
            Solo los mensajes que tú escribiste
          </p>
        </div>
      </header>

      <section className="flex min-h-0 w-full flex-1 flex-col">
        <MessagesPageContent />
      </section>
    </main>
  )
}
