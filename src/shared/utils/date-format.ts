/**
 * Fechas de calendario (deliveryDate).
 * Acepta "YYYY-MM-DD" o ISO completo; NUNCA usa `new Date(iso)` a secas
 * (UTC → un día menos en Perú / UTC−5).
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