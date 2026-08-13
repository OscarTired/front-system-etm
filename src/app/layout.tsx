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
  // El layout NUNCA se mueve/achica con el teclado — ni el shell ni
  // nada que cuelgue de él (bottom nav, FAB, etc) tiene que saber
  // que el teclado existe. El sheet resuelve el teclado por su
  // cuenta con una altura fija (ver sheet-config.ts /
  // popover-content.tsx), no dependiendo de que el layout cambie.
  interactiveWidget: "overlays-content",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {

  return (

    <html lang="es" className="dark h-full overflow-hidden">

      <body
        className={`${geist.className} h-full overflow-hidden`}
        style={{
          // position: fixed además de overflow-hidden — overflow-
          // hidden solo no siempre alcanza en iOS Safari para evitar
          // el rebote/scroll de la página (motor de rubber-band
          // propio de Safari que a veces lo ignora). Con esto el
          // fondo queda estructuralmente incapaz de moverse, así que
          // no importa desde dónde salga un gesto (handle, input,
          // lo que sea) — no hay nada que scrollear, sin usar
          // timeouts ni bloquear/desbloquear nada a mano.
          position: "fixed",
          inset: 0,
        }}
      >

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