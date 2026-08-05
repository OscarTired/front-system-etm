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
 * Dibuja la geometría de una pieza en blanco y negro en un canvas del navegador.
 */
function renderPieceToDataUrl(
  piece: PlacedPiece,
  boxW: number,
  boxH: number,
): string | null {
  if (typeof document === "undefined") return null

  type PathPts = { points: { x: number; y: number }[] }
  const paths: PathPts[] = []

  if (piece.subEntities && piece.subEntities.length > 0) {
    for (const se of piece.subEntities) {
      const pts = se.outline?.points
      if (pts && pts.length >= 2) {
        paths.push({ points: pts })
      }
    }
  }
  if (paths.length === 0) {
    const pts = piece.outline?.points ?? []
    if (pts.length >= 2) {
      paths.push({ points: pts })
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

  const dpr = 3
  const canvas = document.createElement("canvas")
  canvas.width = Math.max(1, Math.round(boxW * dpr))
  canvas.height = Math.max(1, Math.round(boxH * dpr))
  const ctx = canvas.getContext("2d")
  if (!ctx) return null

  ctx.scale(dpr, dpr)
  ctx.fillStyle = "#FFFFFF"
  ctx.fillRect(0, 0, boxW, boxH)
  ctx.strokeStyle = "#E5E7EB"
  ctx.lineWidth = 0.5
  ctx.strokeRect(0.5, 0.5, boxW - 1, boxH - 1)

  const pad = 6
  const s = Math.min((boxW - pad * 2) / bw, (boxH - pad * 2) / bh)
  const ox = pad + (boxW - pad * 2 - bw * s) / 2
  const oy = pad + (boxH - pad * 2 - bh * s) / 2
  const strokeW = 0.35

  for (const path of paths) {
    const pts = path.points
    const step = Math.max(1, Math.floor(pts.length / 600))
    ctx.beginPath()
    let first = true
    for (let i = 0; i < pts.length; i += step) {
      const p = pts[i]
      const x = ox + (p.x - minX) * s
      const y = oy + (maxY - p.y) * s
      if (first) {
        ctx.moveTo(x, y)
        first = false
      } else {
        ctx.lineTo(x, y)
      }
    }
    const p0 = pts[0]
    const pL = pts[pts.length - 1]
    const dist = Math.hypot(p0.x - pL.x, p0.y - pL.y)
    if (dist < Math.max(bw, bh) * 0.02) {
      ctx.lineTo(ox + (p0.x - minX) * s, oy + (maxY - p0.y) * s)
    }
    // Forzado a negro puro para blanco y negro estricto
    ctx.strokeStyle = "#000000"
    ctx.lineWidth = strokeW
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
 * Dibuja la plancha anidada en blanco y negro en un canvas del navegador.
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

  const dpr = 3
  const canvas = document.createElement("canvas")
  canvas.width = Math.max(1, Math.round(boxW * dpr))
  canvas.height = Math.max(1, Math.round(boxH * dpr))
  const ctx = canvas.getContext("2d")
  if (!ctx) return null

  ctx.scale(dpr, dpr)
  ctx.fillStyle = "#FFFFFF"
  ctx.fillRect(0, 0, boxW, boxH)

  const pad = 6
  const s = Math.min((boxW - pad * 2) / sw, (boxH - pad * 2) / sh)
  const ox = pad + (boxW - pad * 2 - sw * s) / 2
  const oy = pad + (boxH - pad * 2 - sh * s) / 2
  const pieceStroke = 0.28

  ctx.fillStyle = "#FFFFFF" // Fondo blanco limpio
  ctx.fillRect(ox, oy, sw * s, sh * s)
  ctx.strokeStyle = "#374151" // Marco de chapa gris oscuro
  ctx.lineWidth = 0.5
  ctx.strokeRect(ox, oy, sw * s, sh * s)

  const drawPath = (
    pts: { x: number; y: number }[],
    color: string,
    lineW: number,
  ) => {
    if (pts.length < 2) return
    const step = Math.max(1, Math.floor(pts.length / 400))
    ctx.beginPath()
    for (let i = 0; i < pts.length; i += step) {
      const p = pts[i]
      const x = ox + p.x * s
      const y = oy + p.y * s
      if (i === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    }
    // Forzado a negro puro para las piezas dentro de la plancha
    ctx.strokeStyle = "#000000"
    ctx.lineWidth = lineW
    ctx.lineJoin = "round"
    ctx.lineCap = "round"
    ctx.stroke()
  }

  for (const piece of sheet.pieces) {
    if (piece.subEntities && piece.subEntities.length > 0) {
      for (const se of piece.subEntities) {
        const pts = se.outline?.points
        if (pts && pts.length >= 2) {
          drawPath(pts, "#000000", pieceStroke)
        }
      }
    } else {
      const pts = piece.outline?.points
      if (pts && pts.length >= 2) {
        drawPath(pts, "#000000", pieceStroke)
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
  maquina?: string
  responsable?: string
}

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

  // ========== 1. PORTADA ==========
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

  content.push({
    text: "Utiles ( Cantidad total de utiles: — ): no aplicable en este nesting",
    fontSize: 8,
    color: "#6B7280",
    margin: [0, 0, 0, 10],
  })

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

  // ========== 2. INFORMACIÓN PIEZA INDIVIDUAL ==========
  const catalog = buildPieceCatalog(sheets, nameById)

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
      ? pieceSketch(sample, 140, 88)
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
          [{ text: "No. de pieza:", fontSize: 7, color: "#6B7280" }, { text: String(idx + 1), fontSize: 8 }],
          [{ text: "Pieza:", fontSize: 7, color: "#6B7280" }, { text: entry.displayName, fontSize: 8 }],
          [{ text: "Nombre del plano:", fontSize: 7, color: "#6B7280" }, { text: "—", fontSize: 8 }],
          [{ text: "Cliente:", fontSize: 7, color: "#6B7280" }, { text: client, fontSize: 8 }],
          [{ text: "Unidades:", fontSize: 7, color: "#6B7280" }, { text: String(entry.quantity), fontSize: 8 }],
          [{ text: "Dimensión:", fontSize: 7, color: "#6B7280" }, { text: `${entry.width.toFixed(1)}mm x ${entry.height.toFixed(1)}mm`, fontSize: 8 }],
          [{ text: "Superficie:", fontSize: 7, color: "#6B7280" }, { text: `${area.toFixed(0)}mm2`, fontSize: 8 }],
          [{ text: "Peso:", fontSize: 7, color: "#6B7280" }, { text: weight > 0 ? `${weight.toFixed(3)}kg` : "—", fontSize: 8 }],
          [{ text: "Duracion:", fontSize: 7, color: "#6B7280" }, { text: "—", fontSize: 8 }],
          [{ text: "Fichero piezas:", fontSize: 7, color: "#6B7280" }, { text: entry.displayName, fontSize: 8 }],
        ],
      },
      layout: tableLayout(),
    }

    content.push({
      unbreakable: true,
      table: {
        widths: [148, "*"],
        body: [[sketch, infoTable]],
      },
      layout: tableLayout(),
      margin: [0, 0, 0, 8],
    } as Content)
  })

  // ========== 3. PEDIDOS DE FABRICACIÓN POR PLANCHA ==========
  sheets.forEach((sheet, si) => {
    const usage = calculateSheetUsagePercent(sheet, sheetConfig)
    const scrap = Math.max(0, 100 - usage)
    
    const counts = new Map<string, { name: string; qty: number; width: number; height: number }>()
    for (const p of sheet.pieces) {
      const name = nameById?.[p.pieceId] ?? p.pieceId
      
      const pts = p.outline?.points ?? []
      let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity
      for (const pt of pts) {
        if (pt.x < minX) minX = pt.x
        if (pt.x > maxX) maxX = pt.x
        if (pt.y < minY) minY = pt.y
        if (pt.y > maxY) maxY = pt.y
      }
      const w = pts.length >= 2 ? maxX - minX : 0
      const hDim = pts.length >= 2 ? maxY - minY : 0

      const prev = counts.get(p.pieceId)
      if (prev) prev.qty++
      else counts.set(p.pieceId, { name, qty: 1, width: w, height: hDim })
    }

    const rows: Content[][] = [
      [h("#"), h("Pieza"), h("Dimensión"), h("Unidades")].map((cell) => ({
        ...(cell as object),
        fillColor: "#111827",
      })) as Content[],
    ]
    let n = 1
    for (const [, info] of counts) {
      const dimStr = info.width > 0 && info.height > 0 
        ? `${info.width.toFixed(1)} x ${info.height.toFixed(1)} mm` 
        : "—"

      rows.push([
        c(String(n++), { align: "center" }),
        c(info.name),
        c(dimStr),
        c(String(info.qty), { align: "center" }),
      ])
    }

    const progName = `${base.replace(/-/g, "_")}_${String(si + 1).padStart(2, "0")}`
    const layoutImg = sheetSketch(sheet, sheetConfig, 385, 230)

    content.push({
      stack: [
        {
          text: "Pedidos de fabricacion:",
          fontSize: 10,
          bold: true,
          margin: [0, 2, 0, 4],
        },
        {
          table: {
            headerRows: 0,
            widths: [385, "*"],
            body: [
              [
                {
                  stack: [layoutImg],
                },
                {
                  stack: [
                    { text: "Pedido de fabricación:", fontSize: 7, color: "#6B7280", margin: [0, 0, 0, 1] },
                    { text: `${base}_${si + 1}`, fontSize: 8, bold: true, margin: [0, 0, 0, 4] },
                    { text: "Programa principal:", fontSize: 7, color: "#6B7280", margin: [0, 0, 0, 1] },
                    { text: progName, fontSize: 8, color: "#2563EB", margin: [0, 0, 0, 4] },
                    { text: "Repet.:", fontSize: 7, color: "#6B7280", margin: [0, 0, 0, 1] },
                    { text: "1", fontSize: 8, bold: true, margin: [0, 0, 0, 4] },
                    { text: "Recortes:", fontSize: 7, color: "#6B7280", margin: [0, 0, 0, 1] },
                    { text: `${scrap.toFixed(0)}%`, fontSize: 8, bold: true, margin: [0, 0, 0, 4] },
                    { text: "Duracion:", fontSize: 7, color: "#6B7280", margin: [0, 0, 0, 1] },
                    { text: "—", fontSize: 8, margin: [0, 0, 0, 4] },
                    { text: "Cantidad de piezas:\ntotal / diferente", fontSize: 7, color: "#6B7280", margin: [0, 0, 0, 1] },
                    { text: `${sheet.pieces.length} / ${counts.size}`, fontSize: 8, bold: true },
                  ],
                },
              ],
              [
                {
                  colSpan: 2,
                  table: {
                    headerRows: 1,
                    widths: [24, "*", "*", 55],
                    body: rows,
                  },
                  layout: tableLayout(),
                  margin: [0, 0, 0, 0],
                },
                {},
              ],
            ],
          },
          layout: tableLayout(),
        },
      ],
      pageBreak: "before",
      margin: [0, 0, 0, 6],
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