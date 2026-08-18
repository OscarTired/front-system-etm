import type { CadTemplate, CreatePieceBody } from "../types/geometry-model"

export type SavedCadTemplate = {
  id: string
  name: string
  template: CadTemplate
  body: CreatePieceBody
  updatedAt: string
}

const KEY = "etm.cad.templates.v1"

export function listCadTemplates(): SavedCadTemplate[] {
  if (typeof window === "undefined") return []
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as SavedCadTemplate[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function saveCadTemplate(
  name: string,
  template: CadTemplate,
  body: CreatePieceBody,
): SavedCadTemplate {
  const items = listCadTemplates()
  const id = `tpl-${Date.now()}`
  const entry: SavedCadTemplate = {
    id,
    name: name.trim() || `${template}-${id}`,
    template,
    body: { ...body, name: name.trim() || body.name },
    updatedAt: new Date().toISOString(),
  }
  items.unshift(entry)
  localStorage.setItem(KEY, JSON.stringify(items.slice(0, 40)))
  return entry
}

export function removeCadTemplate(id: string) {
  const items = listCadTemplates().filter(t => t.id !== id)
  localStorage.setItem(KEY, JSON.stringify(items))
}
