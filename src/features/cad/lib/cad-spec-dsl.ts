import type {
  CadTemplate,
  CreateMallaBody,
  CreatePieceBody,
  CreatePlateBody,
  CreateTiraBody,
} from "../types/geometry-model"

export function pieceToDsl(body: CreatePieceBody): string {
  const t = body.template ?? "tira"
  const lines: string[] = [`plantilla: ${t}`]
  for (const [k, v] of Object.entries(body)) {
    if (k === "template" || v == null) continue
    if (typeof v === "object") {
      lines.push(`${k}: ${JSON.stringify(v)}`)
    } else {
      lines.push(`${k}: ${v}`)
    }
  }
  return lines.join("\n")
}

function parseVal(raw: string): unknown {
  const s = raw.trim()
  if (s.startsWith("{") || s.startsWith("[")) {
    try {
      return JSON.parse(s)
    } catch {
      return s
    }
  }
  const n = Number(s)
  if (Number.isFinite(n) && s !== "") return n
  return s
}

export function dslToPiece(text: string): CreatePieceBody {
  const map = new Map<string, unknown>()
  for (const line of text.split("\n")) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith("#")) continue
    const idx = trimmed.indexOf(":")
    if (idx < 0) continue
    map.set(trimmed.slice(0, idx).trim(), parseVal(trimmed.slice(idx + 1)))
  }
  const plantilla = String(
    map.get("plantilla") ?? map.get("template") ?? "tira",
  ) as CadTemplate
  map.delete("plantilla")
  map.delete("template")

  if (plantilla === "malla") {
    return {
      template: "malla",
      width: Number(map.get("width") ?? 320),
      height: Number(map.get("height") ?? 220),
      margin: Number(map.get("margin") ?? 12),
      cols: Number(map.get("cols") ?? 8),
      rows: Number(map.get("rows") ?? 6),
      holeWidth: Number(map.get("holeWidth") ?? 28),
      holeHeight: Number(map.get("holeHeight") ?? 22),
      gapX: map.has("gapX") ? Number(map.get("gapX")) : undefined,
      gapY: map.has("gapY") ? Number(map.get("gapY")) : undefined,
      thicknessMm: map.has("thicknessMm")
        ? Number(map.get("thicknessMm"))
        : 1.5,
      material: map.has("material") ? String(map.get("material")) : undefined,
      name: map.has("name") ? String(map.get("name")) : undefined,
    } satisfies CreateMallaBody
  }

  if (plantilla === "plate") {
    return {
      template: "plate",
      width: Number(map.get("width") ?? 400),
      height: Number(map.get("height") ?? 300),
      holes: map.get("holes") as CreatePlateBody["holes"],
      thicknessMm: map.has("thicknessMm")
        ? Number(map.get("thicknessMm"))
        : undefined,
      material: map.has("material") ? String(map.get("material")) : undefined,
      name: map.has("name") ? String(map.get("name")) : undefined,
    } satisfies CreatePlateBody
  }

  return {
    template: "tira",
    length: Number(map.get("length") ?? 211.25),
    width: Number(map.get("width") ?? 13.6),
    endRadius: map.has("endRadius") ? Number(map.get("endRadius")) : 0,
    holes: map.get("holes") as CreateTiraBody["holes"],
    bends: map.get("bends") as CreateTiraBody["bends"],
    thicknessMm: map.has("thicknessMm")
      ? Number(map.get("thicknessMm"))
      : 1.5,
    material: map.has("material") ? String(map.get("material")) : undefined,
    name: map.has("name") ? String(map.get("name")) : undefined,
  } satisfies CreateTiraBody
}
