/**
 * Fecha de notificación sin ambigüedad.
 * "14 ago" se leía como "hace 14"; ahora:
 * - recientes → "hace X min/h/días" | "ayer"
 * - más viejas → "14 ago 2026" (siempre con año)
 */
export function formatNotificationDate(dateInput: string): string {
  const date = new Date(dateInput)
  if (Number.isNaN(date.getTime())) return ""

  const now = new Date()
  const diffMs = Math.max(0, now.getTime() - date.getTime())
  const diffMin = Math.floor(diffMs / 60_000)
  const diffHours = Math.floor(diffMin / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffMin < 1) return "Ahora"
  if (diffMin < 60) return `hace ${diffMin} min`
  if (diffHours < 24) return `hace ${diffHours} h`
  if (diffDays === 1) return "ayer"
  if (diffDays < 30) return `hace ${diffDays} días`

  return date.toLocaleDateString("es-PE", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })
}
