/**
 * Fechas de calendario. No usar `new Date(iso)` a secas
 * (UTC−5 corre el día hacia atrás).
 */
export function formatDate(date?: string | null): string {
  if (!date) return "-"

  const day = date.slice(0, 10)
  const [y, m, d] = day.split("-").map(Number)

  if (!y || !m || !d) return "-"

  const local = new Date(y, m - 1, d, 12)

  return local.toLocaleDateString("es-PE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  })
}

/**
 * "YYYY-MM-DD" o ISO → Date local (mediodía).
 * No usar `new Date(str)`: parsea como UTC y en Perú baja un día.
 */
export function parseISODate(value?: string | null): Date | null {
  if (!value) {
    return null
  }

  const day = value.slice(0, 10)
  const [year, month, d] = day.split("-").map(Number)

  if (!year || !month || !d) {
    return null
  }

  return new Date(year, month - 1, d, 12)
}

/**
 * Date local → "YYYY-MM-DD" (componentes locales, no toISOString).
 */
export function toISODateString(date: Date | null): string {
  if (!date) {
    return ""
  }

  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")

  return `${year}-${month}-${day}`
}