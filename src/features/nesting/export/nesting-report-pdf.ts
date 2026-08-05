import pdfMake from "pdfmake/build/pdfmake"
import type { Content, TDocumentDefinitions } from "pdfmake/interfaces"

import { calculateSheetUsagePercent } from "../engine/sheet-usage"
import type { NestedSheet, SheetConfig, PlacedPiece } from "../engine/types"
import { buildPieceCatalog, type PieceNameMap } from "./piece-catalog"
import {
  buildBaseName,
  buildProjectReportName,
  type Nomenclatura,
} from "./nomenclatura"
import { groupIdenticalSheets, formatSheetRangeLabel } from "../utils/svg-render"

let fontsRegistered = false

function ensureFonts(): void {
  if (fontsRegistered) return
  pdfMake.addFonts({
    Roboto: {
      normal: "https://unpkg.com/pdfmake@0.3/build/fonts/Roboto/Roboto-Regular.ttf",
      bold: "https://unpkg.com/pdfmake@0.3/build/fonts/Roboto/Roboto-Medium.ttf",
      italics: "https://unpkg.com/pdfmake@0.3/build/fonts/Roboto/Roboto-Italic.ttf",
      bolditalics: "https://unpkg.com/pdfmake@0.3/build/fonts/Roboto/Roboto-MediumItalic.ttf",
    },
  })
  fontsRegistered = true
}

/** Densidad acero al carbono aprox. (kg/mm³) para estimar peso. */
const STEEL_DENSITY_KG_MM3 = 7.85e-6

function tableLayout() {
  return {
    hLineWidth: () => 0.5,
    vLineWidth: () => 0.5,
    hLineColor: () => "#9CA3AF",
    vLineColor: () => "#9CA3AF",
    paddingLeft: () => 4,
    paddingRight: () => 4,
    paddingTop: () => 3,
    paddingBottom: () => 3,
  }
}

function h(text: string): Content {
  return { text, bold: true, color: "white", alignment: "center", fontSize: 8 }
}

function c(
  text: string | number,
  opts?: { align?: "left" | "center" | "right"; bold?: boolean; color?: string },
): Content {
  return {
    text: String(text),
    alignment: opts?.align ?? "left",
    bold: opts?.bold,
    color: opts?.color,
    fontSize: 8,
  }
}

function labelValue(label: string, value: string): Content[] {
  return [
    { text: label, fontSize: 7, color: "#6B7280" },
    { text: value, fontSize: 8 },
  ]
}

function parseThicknessMm(espesorLabel?: string, sheet?: NestedSheet): number {
  if (sheet?.thicknessMm != null && sheet.thicknessMm > 0) return sheet.thicknessMm
  if (!espesorLabel) return 0
  const n = parseFloat(String(espesorLabel).replace(",", ".").replace(/[^\d.]/g, ""))
  return Number.isFinite(n) && n > 0 ? n : 0
}

function sheetWeightKg(cfg: SheetConfig, thicknessMm: number): number {
  if (thicknessMm <= 0) return 0
  return cfg.width * cfg.height * thicknessMm * STEEL_DENSITY_KG_MM3
}

function pieceWeightKg(areaMm2: number, thicknessMm: number): number {
  if (thicknessMm <= 0 || areaMm2 <= 0) return 0
  return areaMm2 * thicknessMm * STEEL_DENSITY_KG_MM3
}

/**
 * Dibuja la geometría de una pieza en un canvas del navegador y devuelve
 * data URL PNG. Mucho más fiable que el canvas nativo de pdfmake (que
 * a menudo no pinta nada dentro de celdas de tabla).
 */
function renderPieceToDataUrl(
  piece: PlacedPiece,
  boxW: number,
  boxH: number,
): string | null {
  if (typeof document === "undefined") return null

  type PathPts = { points: { x: number; y: number }[]; color?: string }
  const paths: PathPts[] = []

  if (piece.subEntities && piece.subEntities.length > 0) {
    for (const se of piece.subEntities) {
      const pts = se.outline?.points
      if (pts && pts.length >= 2) {
        paths.push({ points: pts, color: se.color ?? "#111827" })
      }
    }
  }
  if (paths.length === 0) {
    const pts = piece.outline?.points ?? []
    if (pts.length >= 2) {
      paths.push({ points: pts, color: piece.color ?? "#111827" })
    }
  }
  if (paths.length === 0) return null

  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity
  for (const path of paths) {
    for (const p of path.points) {
      if (p.x < minX) minX = p.x
      if (p.x > maxX) maxX = p.x
      if (p.y < minY) minY = p.y
      if (p.y > maxY) maxY = p.y
    }
  }
  const bw = Math.max(maxX - minX, 1e-6)
  const bh = Math.max(maxY - minY, 1e-6)

  const dpr = 2
  const canvas = document.createElement("canvas")
  canvas.width = Math.max(1, Math.round(boxW * dpr))
  canvas.height = Math.max(1, Math.round(boxH * dpr))
  const ctx = canvas.getContext("2d")
  if (!ctx) return null

  ctx.scale(dpr, dpr)
  ctx.fillStyle = "#FFFFFF"
  ctx.fillRect(0, 0, boxW, boxH)
  ctx.strokeStyle = "#E5E7EB"
  ctx.lineWidth = 0.8
  ctx.strokeRect(0.5, 0.5, boxW - 1, boxH - 1)

  const pad = 8
  const s = Math.min((boxW - pad * 2) / bw, (boxH - pad * 2) / bh)
  const ox = pad + (boxW - pad * 2 - bw * s) / 2
  const oy = pad + (boxH - pad * 2 - bh * s) / 2

  for (const path of paths) {
    const pts = path.points
    const step = Math.max(1, Math.floor(pts.length / 400))
    ctx.beginPath()
    for (let i = 0; i < pts.length; i += step) {
      const p = pts[i]
      const x = ox + (p.x - minX) * s
      const y = oy + (maxY - p.y) * s // Y invertido
      if (i === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    }
    // cerrar
    const p0 = pts[0]
    ctx.lineTo(ox + (p0.x - minX) * s, oy + (maxY - p0.y) * s)
    ctx.strokeStyle = path.color && path.color.startsWith("#") ? path.color : "#111827"
    ctx.lineWidth = 1.2
    ctx.lineJoin = "round"
    ctx.lineCap = "round"
    ctx.stroke()
  }

  try {
    return canvas.toDataURL("image/png")
  } catch {
    return null
  }
}

/** Miniatura de pieza: imagen PNG embebida (fiable) o placeholder. */
function pieceSketch(piece: PlacedPiece, boxW: number, boxH: number): Content {
  const dataUrl = renderPieceToDataUrl(piece, boxW, boxH)
  if (dataUrl) {
    return {
      image: dataUrl,
      width: boxW,
      height: boxH,
    }
  }
  return {
    stack: [
      {
        canvas: [
          {
            type: "rect",
            x: 1,
            y: 1,
            w: boxW - 2,
            h: boxH - 2,
            lineWidth: 0.7,
            lineColor: "#D1D5DB",
            dash: { length: 4 },
          },
        ],
        width: boxW,
        height: boxH,
      },
      {
        text: "sin geometría",
        fontSize: 7,
        color: "#9CA3AF",
        alignment: "center",
        margin: [0, -(boxH / 2 + 6), 0, 0],
      },
    ],
  } as Content
}

/**
 * Croquis de la plancha completa (piezas en su posición) para la página
 * de "Pedidos de fabricación".
 */
function renderSheetToDataUrl(
  sheet: NestedSheet,
  sheetConfig: SheetConfig,
  boxW: number,
  boxH: number,
): string | null {
  if (typeof document === "undefined") return null
  if (!sheet.pieces.length) return null

  const sw = Math.max(sheetConfig.width, 1)
  const sh = Math.max(sheetConfig.height, 1)

  const dpr = 2
  const canvas = document.createElement("canvas")
  canvas.width = Math.max(1, Math.round(boxW * dpr))
  canvas.height = Math.max(1, Math.round(boxH * dpr))
  const ctx = canvas.getContext("2d")
  if (!ctx) return null

  ctx.scale(dpr, dpr)
  ctx.fillStyle = "#FFFFFF"
  ctx.fillRect(0, 0, boxW, boxH)

  const pad = 10
  const s = Math.min((boxW - pad * 2) / sw, (boxH - pad * 2) / sh)
  const ox = pad + (boxW - pad * 2 - sw * s) / 2
  const oy = pad + (boxH - pad * 2 - sh * s) / 2

  // Plancha
  ctx.fillStyle = "#F3F4F6"
  ctx.fillRect(ox, oy, sw * s, sh * s)
  ctx.strokeStyle = "#374151"
  ctx.lineWidth = 1.2
  ctx.strokeRect(ox, oy, sw * s, sh * s)

  const drawPath = (
    pts: { x: number; y: number }[],
    color: string,
    lineW: number,
  ) => {
    if (pts.length < 2) return
    const step = Math.max(1, Math.floor(pts.length / 200))
    ctx.beginPath()
    for (let i = 0; i < pts.length; i += step) {
      const p = pts[i]
      const x = ox + p.x * s
      const y = oy + (sh - p.y) * s // Y invertido respecto a CAD
      if (i === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    }
    ctx.strokeStyle = color
    ctx.lineWidth = lineW
    ctx.lineJoin = "round"
    ctx.stroke()
  }

  for (const piece of sheet.pieces) {
    if (piece.subEntities && piece.subEntities.length > 0) {
      for (const se of piece.subEntities) {
        const pts = se.outline?.points
        if (pts && pts.length >= 2) {
          drawPath(pts, se.color ?? "#111827", 0.9)
        }
      }
    } else {
      const pts = piece.outline?.points
      if (pts && pts.length >= 2) {
        drawPath(pts, piece.color ?? "#111827", 0.9)
      }
    }
  }

  try {
    return canvas.toDataURL("image/png")
  } catch {
    return null
  }
}

function sheetSketch(
  sheet: NestedSheet,
  sheetConfig: SheetConfig,
  boxW: number,
  boxH: number,
): Content {
  const dataUrl = renderSheetToDataUrl(sheet, sheetConfig, boxW, boxH)
  if (dataUrl) {
    return { image: dataUrl, width: boxW, height: boxH }
  }
  return {
    canvas: [
      {
        type: "rect",
        x: 1,
        y: 1,
        w: boxW - 2,
        h: boxH - 2,
        lineWidth: 0.7,
        lineColor: "#D1D5DB",
      },
    ],
    width: boxW,
    height: boxH,
  } as unknown as Content
}

export interface NestingReportOptions {
  nomenclatura: Nomenclatura
  sheets: NestedSheet[]
  sheetConfig: SheetConfig
  nameById?: PieceNameMap
  materialLabel?: string
  espesorLabel?: string
  cliente?: string
  /** Máquina / celda (ej. TruPunch 1000). */
  maquina?: string
  responsable?: string
}

/**
 * Paquete de producción alineado a TruTops:
 *
 * 1) Portada — título, duración/recortes (estimados), útiles (n/d), programas NC
 * 2) Lista de piezas del pedido de anidamiento (BOM)
 * 3) Información pieza individual (croquis + datos)
 * 4) Pedidos de fabricación por plancha
 *
 * Metadatos PDF: Title / Author / Creator / Subject al estilo documento de taller.
 * Peso estimado con densidad acero 7.85 g/cm³ si hay espesor.
 * Duración de máquina y útiles de punch: no disponibles en el motor → "—".
 */
export async function exportNestingReportPdf({
  nomenclatura,
  sheets,
  sheetConfig,
  nameById,
  materialLabel,
  espesorLabel,
  cliente,
  maquina,
  responsable,
}: NestingReportOptions): Promise<void> {
  ensureFonts()

  const groups = groupIdenticalSheets(sheets)
  const totalPieces = sheets.reduce((sum, s) => sum + s.pieces.length, 0)
  const sheetCount = sheets.length
  let scrapSum = 0
  for (const s of sheets) {
    scrapSum += Math.max(0, 100 - calculateSheetUsagePercent(s, sheetConfig))
  }
  const scrapAvg = sheetCount > 0 ? scrapSum / sheetCount : 0

  const mat = materialLabel?.trim() || nomenclatura.material || "—"
  const thickLabel = espesorLabel?.trim() || nomenclatura.espesor || "—"
  const thickMm = parseThicknessMm(espesorLabel) || parseThicknessMm(nomenclatura.espesor)
  const base = buildBaseName(nomenclatura)
  const reportId = buildProjectReportName(nomenclatura, totalPieces)
  const machineTitle = maquina?.trim() || "Nesting"
  const client = cliente?.trim() || "—"

  const content: Content[] = []

  // ========== 1. PORTADA (como TruTops) ==========
  content.push({
    columns: [
      {
        width: 28,
        canvas: [
          { type: "rect", x: 0, y: 0, w: 18, h: 18, color: "#2563EB" },
        ],
      },
      {
        width: "*",
        stack: [
          {
            text: `Paquete de producción para ${machineTitle} : ${reportId}`,
            fontSize: 12,
            bold: true,
          },
          {
            margin: [0, 8, 0, 0],
            columns: [
              {
                width: "*",
                stack: [
                  {
                    text: [
                      { text: "Duracion total:  ", color: "#6B7280" },
                      { text: "—", bold: true },
                    ],
                    fontSize: 9,
                  },
                  {
                    text: [
                      { text: "Cantidad de piezas:  ", color: "#6B7280" },
                      { text: String(totalPieces), bold: true },
                    ],
                    fontSize: 9,
                    margin: [0, 3, 0, 0],
                  },
                  {
                    text: [
                      { text: "Responsable:  ", color: "#6B7280" },
                      { text: responsable?.trim() || "—" },
                    ],
                    fontSize: 9,
                    margin: [0, 3, 0, 0],
                  },
                ],
              },
              {
                width: "*",
                stack: [
                  {
                    text: [
                      { text: "Recortes:  ", color: "#6B7280" },
                      { text: `${scrapAvg.toFixed(0)}%`, bold: true },
                    ],
                    fontSize: 9,
                  },
                  {
                    text: [
                      { text: "Cantidad de chapas:  ", color: "#6B7280" },
                      { text: String(sheetCount), bold: true },
                    ],
                    fontSize: 9,
                    margin: [0, 3, 0, 0],
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
    margin: [0, 0, 0, 14],
  })

  // Útiles: no existen en el motor de nesting (corte láser/punch sin tool list)
  content.push({
    text: "Utiles ( Cantidad total de utiles: — ): no aplicable en este nesting",
    fontSize: 8,
    color: "#6B7280",
    margin: [0, 0, 0, 10],
  })

  // Programas NC
  const progBody: Content[][] = [
    [
      h("Programa principal"),
      h("Repet."),
      h("Material de hoja"),
      h("Peso"),
      h("Recortes"),
      h("Duracion"),
    ].map((cell) => ({ ...(cell as object), fillColor: "#111827" })) as Content[],
  ]

  groups.forEach((g, gi) => {
    const usage = calculateSheetUsagePercent(g.sheet, sheetConfig)
    const scrap = Math.max(0, 100 - usage)
    const tMm =
      g.sheet.thicknessMm != null && g.sheet.thicknessMm > 0
        ? g.sheet.thicknessMm
        : thickMm
    const tStr = tMm > 0 ? tMm.toFixed(2) : thickLabel
    const matLine = `${mat} ${sheetConfig.width} x ${sheetConfig.height} x ${tStr}`
    const wKg = sheetWeightKg(sheetConfig, tMm)
    const progName = `${base.replace(/-/g, "_")}_${String(gi + 1).padStart(2, "0")}`

    progBody.push([
      c(progName, { color: "#2563EB" }),
      c(String(g.count), { align: "center" }),
      c(matLine),
      c(wKg > 0 ? `${wKg.toFixed(2)}kg` : "—", { align: "right" }),
      c(`${scrap.toFixed(0)}%`, { align: "center" }),
      c("—", { align: "center" }),
    ])
  })

  content.push({
    stack: [
      { text: "Programas NC:", fontSize: 10, bold: true, margin: [0, 0, 0, 6] },
      {
        table: {
          headerRows: 1,
          widths: ["*", 36, "*", 48, 42, 48],
          body: progBody,
        },
        layout: tableLayout(),
      },
    ],
    margin: [0, 0, 0, 16],
  })

  // ========== 2. BOM piezas (Pedido de anidamiento) ==========
  const catalog = buildPieceCatalog(sheets, nameById)
  const bomBody: Content[][] = [
    [h("#"), h("Fichero piezas"), h("Pieza"), h("Unidades")].map((cell) => ({
      ...(cell as object),
      fillColor: "#111827",
    })) as Content[],
  ]
  catalog.forEach((entry, idx) => {
    bomBody.push([
      c(String(idx + 1), { align: "center" }),
      c(entry.displayName, { color: "#2563EB" }),
      c(entry.displayName),
      c(String(entry.quantity), { align: "center" }),
    ])
  })

  content.push({
    text: `Piezas: (Pedido de anidamiento : ${reportId})`,
    fontSize: 10,
    bold: true,
    margin: [0, 4, 0, 6],
    pageBreak: "before",
  })
  content.push({
    table: {
      headerRows: 1,
      widths: [28, "*", "*", 50],
      body: bomBody,
    },
    layout: tableLayout(),
    margin: [0, 0, 0, 12],
  })

  // ========== 3. Información pieza individual ==========
  content.push({
    text: "Información pieza individual:",
    fontSize: 10,
    bold: true,
    margin: [0, 8, 0, 8],
    pageBreak: "before",
  })

  const sampleById = new Map<string, PlacedPiece>()
  for (const sheet of sheets) {
    for (const p of sheet.pieces) {
      if (!sampleById.has(p.pieceId)) sampleById.set(p.pieceId, p)
    }
  }

  catalog.forEach((entry, idx) => {
    const sample = sampleById.get(entry.pieceId)
    const sketch = sample
      ? pieceSketch(sample, 150, 95)
      : ({
          text: "—",
          fontSize: 8,
          color: "#9CA3AF",
          alignment: "center",
          margin: [0, 40, 0, 0],
        } as Content)
    const area = entry.width * entry.height
    const weight = pieceWeightKg(area, thickMm)

    const infoTable: Content = {
      table: {
        widths: [82, "*"],
        body: [
          labelValue("No. de pieza:", String(idx + 1)),
          labelValue("Pieza:", entry.displayName),
          labelValue("Nombre del plano:", "—"),
          labelValue("Cliente:", client),
          labelValue("Unidades:", String(entry.quantity)),
          labelValue(
            "Dimensión:",
            `${entry.width.toFixed(1)}mm x ${entry.height.toFixed(1)}mm`,
          ),
          labelValue("Superficie:", `${area.toFixed(0)}mm2`),
          labelValue("Peso:", weight > 0 ? `${weight.toFixed(3)}kg` : "—"),
          labelValue("Duracion:", "—"),
          labelValue("Fichero piezas:", entry.displayName),
        ],
      },
      layout: tableLayout(),
    }

    content.push({
      unbreakable: true,
      table: {
        widths: [158, "*"],
        body: [[sketch, infoTable]],
      },
      layout: tableLayout(),
      margin: [0, 0, 0, 8],
    } as Content)
  })

  // ========== 4. Pedidos de fabricación por plancha ==========
  sheets.forEach((sheet, si) => {
    const usage = calculateSheetUsagePercent(sheet, sheetConfig)
    const scrap = Math.max(0, 100 - usage)
    const counts = new Map<string, { name: string; qty: number }>()
    for (const p of sheet.pieces) {
      const name = nameById?.[p.pieceId] ?? p.pieceId
      const prev = counts.get(p.pieceId)
      if (prev) prev.qty++
      else counts.set(p.pieceId, { name, qty: 1 })
    }

    const rows: Content[][] = [
      [h("#"), h("Pieza"), h("Fichero piezas"), h("Unidades")].map((cell) => ({
        ...(cell as object),
        fillColor: "#111827",
      })) as Content[],
    ]
    let n = 1
    for (const [, info] of counts) {
      rows.push([
        c(String(n++), { align: "center" }),
        c(info.name),
        c(info.name, { color: "#2563EB" }),
        c(String(info.qty), { align: "center" }),
      ])
    }

    const progName = `${base.replace(/-/g, "_")}_${String(si + 1).padStart(2, "0")}`
    const tMm =
      sheet.thicknessMm != null && sheet.thicknessMm > 0 ? sheet.thicknessMm : thickMm

    const layoutImg = sheetSketch(sheet, sheetConfig, 520, 280)

    content.push({
      stack: [
        {
          text: "Pedidos de fabricacion:",
          fontSize: 10,
          bold: true,
          margin: [0, 4, 0, 6],
        },
        // Croquis de la plancha (arriba, a ancho completo)
        {
          stack: [layoutImg],
          margin: [0, 0, 0, 10],
        },
        // Tabla de piezas + metadatos del pedido
        {
          columns: [
            {
              width: "*",
              table: {
                headerRows: 1,
                widths: [28, "*", "*", 48],
                body: rows,
              },
              layout: tableLayout(),
            },
            {
              width: 155,
              margin: [8, 0, 0, 0],
              table: {
                widths: [64, "*"],
                body: [
                  labelValue("Pedido de fabricación:", `${base}_${si + 1}`),
                  labelValue("Programa principal:", progName),
                  labelValue("Repet.:", "1"),
                  labelValue("Recortes:", `${scrap.toFixed(0)}%`),
                  labelValue("Duracion:", "—"),
                  labelValue(
                    "Cantidad de piezas: total / diferente",
                    `${sheet.pieces.length} / ${counts.size}`,
                  ),
                  labelValue(
                    "Material:",
                    `${mat} ${sheetConfig.width} x ${sheetConfig.height} x ${
                      tMm > 0 ? tMm.toFixed(2) : thickLabel
                    }`,
                  ),
                ],
              },
              layout: tableLayout(),
            },
          ],
        },
      ],
      pageBreak: "before",
      margin: [0, 0, 0, 8],
    } as Content)
  })

  const docDefinition: TDocumentDefinitions = {
    pageSize: "A4",
    pageMargins: [24, 24, 24, 32],
    info: {
      title: `Paquete de producción : ${reportId}`,
      author: responsable?.trim() || "ETM Nesting",
      subject: `Nesting ${base} — ${sheetCount} chapas, ${totalPieces} piezas`,
      creator: "ETM Front System — Nesting",
      keywords: `nesting, ${mat}, ${thickLabel}, ${base}`,
    },
    content,
    defaultStyle: { font: "Roboto", fontSize: 8 },
    footer: (currentPage, pageCount) => ({
      text: `${reportId}  ·  ${currentPage} / ${pageCount}`,
      alignment: "center",
      fontSize: 7,
      color: "#9CA3AF",
      margin: [0, 12, 0, 0],
    }),
  }

  await pdfMake.createPdf(docDefinition).download(`${reportId}.pdf`)
}
