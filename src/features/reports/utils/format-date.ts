/**
 * Fechas de calendario en reportes.
 * Acepta "YYYY-MM-DD" o ISO; no usa `new Date(iso)` a secas.
 */
export function formatDate(value: string | null): string {
  if (!value) return "—"

  const day = value.slice(0, 10)
  const [y, m, d] = day.split("-").map(Number)

  if (!y || !m || !d) return "—"

  const local = new Date(y, m - 1, d, 12)

  return local.toLocaleDateString("es-PE")
}