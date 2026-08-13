import type {
  Metadata,
  Viewport,
} from "next"

import {
  Geist,
} from "next/font/google"

import "./globals.css"

import {
  ApiClientProvider,
} from "@/lib/api-client-provider"

import {
  QueryProvider,
} from "@/providers/query-provider"

import {
  Sonner,
} from "@/components/ui/sonner"

import{
  RealtimeProvider,
}from"@/shared/realtime/realtime-provider"

import {
  ResponsiveProvider,
} from "@/shared/responsive/responsive-context"

const geist =
  Geist({
    subsets: ["latin"],
  })

export const metadata: Metadata = {
  title: "ETM PROD",
  description:
    "ETM SAC Production System",
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  // overlays-content (default): el teclado NO redimensiona el layout.
  // El sheet se ancla con visualViewport (popover-content). Así no
  // hay doble conteo teclado (layout shrink + bottom offset).
  interactiveWidget: "overlays-content",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {

  return (

    <html lang="es" className="dark h-svh overflow-hidden">

      <body className={`${geist.className} h-svh overflow-hidden`}>

        <ApiClientProvider />

        <QueryProvider>

          <RealtimeProvider>

            <ResponsiveProvider initialBreakpoint="desktop">

              <div className="flex h-full min-h-0 flex-col overflow-hidden">

                {children}

              </div>

              <Sonner />

            </ResponsiveProvider>

          </RealtimeProvider>

        </QueryProvider>

      </body>

    </html>

  )

}