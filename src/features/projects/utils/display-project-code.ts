/**
 * Display-only: "26-038-M" → "038", "26-038" → "038".
 */
export function displayProjectCode(code?: string | null): string {
  if (!code) return ""

  const trimmed = code.trim().toUpperCase()

  const withYear = trimmed.match(/^\d{2}-(\d{3,})(?:-[A-Z]+)?$/)
  if (withYear) return withYear[1]

  const bare = trimmed.match(/^(\d{3,})(?:-[A-Z]+)?$/)
  if (bare) return bare[1]

  return trimmed
    .replace(/^\d{2}-/, "")
    .replace(/-[A-Z]+$/, "")
}
