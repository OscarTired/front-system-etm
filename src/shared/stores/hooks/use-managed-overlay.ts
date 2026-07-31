"use client"

import { useOverlayStore, type OverlayId } from "../overlay-store"

type ManagedOverlayId = Exclude<OverlayId, null>

// Encapsula el patrón "este popover reclama un slot en el store
// compartido" que antes estaba repetido, casi idéntico, en
// notification-bell.tsx, sidebar-presence.tsx y use-profile-panel.ts.
//
// - open: true solo cuando ESTE id es el que tiene el slot.
// - setOpen(true): reclama el slot (cierra cualquier otro overlay
//   que lo tuviera, porque solo puede haber uno).
// - setOpen(false): libera el slot, pero SOLO si todavía era el
//   dueño — evita que un cierre "tardío" de A pise la apertura de B
//   si el usuario abrió B mientras A estaba cerrando.
export function useManagedOverlay(id: ManagedOverlayId) {

  const open = useOverlayStore(s => s.open === id)
  const setOverlayOpen = useOverlayStore(s => s.setOpen)
  const closeOverlay = useOverlayStore(s => s.close)

  const setOpen = (next: boolean) => {

    if (next) {
      setOverlayOpen(id)
      return
    }

    if (useOverlayStore.getState().open === id) {
      closeOverlay()
    }

  }

  return { open, setOpen }

}