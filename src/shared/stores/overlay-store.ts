import { create } from "zustand"

export type OverlayId =
  | "filters"
  | "export"
  | "profile"
  | "notifications"
  | "presence"
  | "messages"
  | null

type OverlayStore = {
  open: OverlayId
  setOpen: (id: OverlayId) => void
  close: () => void
}

export const useOverlayStore =
  create<OverlayStore>(set => ({
    open: null,
    setOpen: open =>
      set({ open }),
    close: () =>
      set({ open: null }),
  }))