"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import {
  fetchEventSource,
  EventStreamContentType,
} from "@microsoft/fetch-event-source"

import { authSession } from "@/lib/auth-session"
import { apiBaseUrl } from "@/lib/api-url"
import { useAuthStore } from "@/features/auth/store/auth-store"

import { NotificationToast } from "@/features/notifications/components/notification-toast"
import { resolveNotificationHref } from "@/features/notifications/utils/resolve-notification-href"
import type { Notification } from "@/features/notifications/types/notification.types"

import { realtimeRegistry } from "./types/realtime-registry"

// Reconexiones más cortas que esto se tratan como "flicker" (cambio de
// wifi↔datos, breve pausa de la app en segundo plano) y NO disparan
// invalidateQueries(): en un corte tan breve normalmente no se perdieron
// eventos reales. Solo si estuvo caído más tiempo que esto
// asumimos que pudimos perdernos actualizaciones y vale la pena invalidar.
const RECONNECT_INVALIDATE_THRESHOLD_MS = 15_000

export function RealtimeProvider({
  children,
}: {
  children: React.ReactNode
}) {

  const user = useAuthStore(s => s.user)
  const queryClient = useQueryClient()
  const router = useRouter()

  useEffect(() => {

    // sin sesión activa, no conectamos
    if (!user) {
      return
    }

    const token = authSession.get()

    if (!token) {
      return
    }

    const controller = new AbortController()

    // Esta bandera pertenece a ESTA ejecución del efecto.
    // Si React desmonta (Strict Mode double-invoke, unmount real, etc.),
    // la marcamos true y cualquier mensaje que llegue después por este
    // canal específico se descarta, sin importar cuánto tarde el socket
    // en cerrarse del lado del servidor.
    let stale = false

    // true recién después de la primera conexión exitosa.
    // Sirve para no invalidar todo en el montaje inicial (ya se hace
    // fetch normal al montar cada useQuery) — solo cuando se reabre
    // el stream tras haberse caído por un corte de red/deploy/etc.
    let hasConnectedOnce = false

    // Momento en que la conexión se cayó (error o cierre). Se limpia al
    // reconectar. Si es null cuando reabrimos, es la conexión inicial
    // (no hubo caída que invalidar).
    let disconnectedAt: number | null = null

    fetchEventSource(
      `${apiBaseUrl}/realtime/events`,
      {

        signal: controller.signal,

        headers: {
          Authorization: `Bearer ${token}`,
        },

        openWhenHidden: true,

        async onopen(response) {

          if (
            response.ok &&
            response.headers
              .get("content-type")
              ?.includes(EventStreamContentType)
          ) {

            if (hasConnectedOnce) {

              const downtimeMs = disconnectedAt
                ? Date.now() - disconnectedAt
                : 0

              // Solo invalidamos si estuvo caída un tiempo relevante.
              // En mobile la conexión SSE se corta y reconecta muy
              // seguido (cambio de wifi↔datos, la app pasa a segundo
              // plano un instante) y esos flickers reconectan en
              // segundos: ahí no nos perdimos eventos reales y no vale
              // la pena invalidar TODAS las queries activas de golpe.
              if (downtimeMs >= RECONNECT_INVALIDATE_THRESHOLD_MS) {
                // Pudimos habernos perdido eventos mientras estuvo
                // caída. Invalidar todo fuerza a que, en el próximo
                // acceso/foco, se traiga lo real. No dispara requests
                // a ciegas: solo refetchea queries con observadores
                // montados en este momento.
                queryClient.invalidateQueries()
              }

            }

            hasConnectedOnce = true
            disconnectedAt = null

            return

          }

          if (response.status === 401) {

            authSession.set(null)
            useAuthStore.getState().logout()

            if (typeof window !== "undefined") {
              window.location.href = "/login"
            }

          }

          throw new Error(`Realtime ${response.status}`)

        },

        onmessage(message) {

          // canal invalidado: aunque el servidor todavía no cerró
          // el socket, este efecto ya fue desmontado. No procesar.
          if (stale) return

          if (!message.data || message.data.trim() === "") {
            return
          }

          const event = JSON.parse(message.data)

          if (event.type === "PING") {
            return
          }

          realtimeRegistry(event)

          // El registry ya actualizó la campana/el contador — esto
          // de acá es aparte: un toast visible aunque la campana
          // esté cerrada. Solo para comentarios/menciones nuevos
          // (CREATED), no para BULK_READ/DELETED/etc., que no tiene
          // sentido "anunciar".
          if (
            event.entity === "NOTIFICATION" &&
            event.action === "CREATED"
          ) {

            const notification = event.payload as Notification

            toast.custom(
              (id) => (
                <NotificationToast
                  notification={notification}
                  onNavigate={() => {
                    router.push(
                      resolveNotificationHref(notification),
                    )
                    toast.dismiss(id)
                  }}
                />
              ),
              {
                // Sin duration fijo (o Infinity), sonner lo saca
                // solo a los 4s por default — acá se pidió a
                // propósito que se quede hasta que el usuario lo
                // cierre (X, que ya pone sonner solo) o lo toque
                // (navega y se cierra).
                duration: Infinity,
              },
            )

          }

        },

        onclose() {
          // el navegador reintenta solo si el effect sigue montado.
          // Marcamos el inicio de la caída (si no había una ya en curso)
          // para poder medir cuánto duró cuando se reconecte.
          if (disconnectedAt === null) {
            disconnectedAt = Date.now()
          }
        },

        onerror(error) {

          // el efecto ya se desmontó y abortó esta conexión a propósito:
          // no dejar que fetchEventSource la revida con un retry.
          if (controller.signal.aborted) {
            throw error
          }

          // si ya hicimos logout, no seguir reintentando en loop
          if (!authSession.get()) {
            throw error // corta el retry automático de fetchEventSource
          }

          // Marcamos el inicio de la caída (si no había una ya en curso;
          // reintentos sucesivos del mismo corte no deben resetear el
          // timestamp, o nunca superaríamos el threshold).
          if (disconnectedAt === null) {
            disconnectedAt = Date.now()
          }

          // no relanzar acá: dejamos que fetch-event-source reintente
          // con su backoff normal. Cuando reabra, onopen dispara la
          // invalidación si corresponde.

        },

      },
    )

    return () => {
      stale = true
      controller.abort()
    }

  }, [user, queryClient])

  return <>{children}</>

}