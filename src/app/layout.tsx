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

// Explícito en vez de confiar en el default implícito de Next —
// sin esto, según versión/navegador, el mobile puede aplicar el
// clásico delay de ~300ms en cada tap (esperando ver si es un
// doble-tap para hacer zoom), sintiéndose como que "todo responde
// lento" en toda la app.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {

  return (

    <html lang="es" className="dark h-full overflow-hidden">

      <body className={`${geist.className} h-full overflow-hidden`}>

        <ApiClientProvider />

        <QueryProvider>

          <RealtimeProvider>

            <ResponsiveProvider initialBreakpoint="desktop">

              <div className="flex h-full min-h-0 flex-col overflow-hidden">

                {children}

              </div>

              {/* Adentro de ResponsiveProvider a propósito — antes
                  estaba afuera de TODOS los providers (hermano de
                  QueryProvider), así que cualquier cosa que sonner
                  renderice dentro de un toast (ej. NotificationToast,
                  que usa DynamicBadge, que usa useResponsive() por su
                  cuenta) explotaba con "useResponsive debe usarse
                  dentro de un ResponsiveProvider" — el toast vivía
                  fuera del árbol de React que provee ese contexto. */}
              <Sonner />

            </ResponsiveProvider>

          </RealtimeProvider>

        </QueryProvider>

      </body>

    </html>

  )

}