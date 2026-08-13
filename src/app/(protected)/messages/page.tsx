"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

import { MessagesPageContent } from "@/features/comments/components/messages-page-content"
import { usePageTitle } from "@/shared/responsive/navigation/hooks/use-page-title"
import { useResponsive } from "@/shared/responsive/hooks/use-responsive"

/** Desktop/tablet: MessageBell en sidebar. Móvil: página. */
export default function MessagesPage() {
  usePageTitle("Mensajes")
  const router = useRouter()
  const { isMobile } = useResponsive()

  useEffect(() => {
    if (!isMobile) router.replace("/projects")
  }, [isMobile, router])

  if (!isMobile) return null

  return (
    <main className="flex h-full min-h-0 flex-col bg-background px-3 pb-2 text-foreground select-none">
      <section className="flex min-h-0 w-full flex-1 flex-col">
        <MessagesPageContent />
      </section>
    </main>
  )
}
