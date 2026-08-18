/**
 * Pone los ítems seleccionados al inicio de la lista (selectores).
 * Fuente de verdad del orden visual en menús.
 */
export function withSelectedFirst<T extends { id: string }>(
  items: readonly T[],
  selectedId: string | null | undefined,
): T[]
export function withSelectedFirst<T extends { id: string }>(
  items: readonly T[],
  selectedIds: ReadonlySet<string> | readonly string[],
): T[]
export function withSelectedFirst<T extends { id: string }>(
  items: readonly T[],
  selected: string | null | undefined | ReadonlySet<string> | readonly string[],
): T[] {
  if (items.length === 0) return []

  const ids: Set<string> =
    selected == null || selected === ""
      ? new Set()
      : typeof selected === "string"
        ? new Set([selected])
        : selected instanceof Set
          ? selected
          : new Set(selected)

  if (ids.size === 0) return [...items]

  const top: T[] = []
  const rest: T[] = []
  for (const item of items) {
    if (ids.has(item.id)) top.push(item)
    else rest.push(item)
  }
  return top.length === 0 ? [...items] : [...top, ...rest]
}
