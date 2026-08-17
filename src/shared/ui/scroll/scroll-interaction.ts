/** Evento al scrollear boards (cierra overlays, etc.). */
export const PIPELINE_SCROLL_INTERACTION_EVENT =
  "pipeline-scroll-interaction"

export function notifyScrollInteraction() {
  if (typeof window === "undefined") return
  window.dispatchEvent(new Event(PIPELINE_SCROLL_INTERACTION_EVENT))
}
