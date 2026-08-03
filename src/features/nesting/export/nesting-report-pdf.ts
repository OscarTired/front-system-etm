import pdfMake from "pdfmake/build/pdfmake"
import type { CanvasElement, Content, TDocumentDefinitions } from "pdfmake/interfaces"

import { boundingRect } from "../engine/geometry"
import { calculateSheetUsagePercent } from "../engine/sheet-usage"
import type { NestedSheet, SheetConfig } from "../engine/types"
import { buildPieceCatalog } from "./piece-catalog"
import { buildBaseName, type Nomenclatura } from "./nomenclatura"
import { groupIdenticalSheets, formatSheetRangeLabel, type SheetGroup } from "../utils/svg-render"

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

function headerCell(text: string): Content {
  return { text, bold: true, color: "white", alignment: "center", fontSize: 8 }
}

function bodyCell(text: string, alignment: "left" | "center" | "right" = "center"): Content {
  return { text, alignment, fontSize: 8 }
}

function tableLayout() {
  return {
    hLineWidth: () => 0.6,
    vLineWidth: () => 0.6,
    hLineColor: () => "#D1D5DB",
    vLineColor: () => "#D1D5DB",
    fillColor: (row: number) => (row === 0 ? "#1F2937" : row % 2 === 0 ? "#F9FAFB" : null),
    paddingLeft: () => 5,
    paddingRight: () => 5,
    paddingTop: () => 4,
    paddingBottom: () => 4,
  }
}

function divider() {
  return {
    canvas: [
      { type: "line" as const, x1: 0, y1: 0, x2: 780, y2: 0, lineWidth: 1, lineColor: "#D1D5DB" },
    ],
    margin: [0, 0, 0, 18] as [number, number, number, number],
  }
}

function buildHeader(nom: Nomenclatura, totalPieces: number, sheetCount: number) {
  return {
    table: {
      widths: ["*", 220],
      body: [
        [
          {
            stack: [
              { text: "REPORTE DE NESTING", fontSize: 18, bold: true },
              {
                text: buildBaseName(nom),
                fontSize: 11,
                color: "#6B7280",
                margin: [0, 4, 0, 0],
              },
            ],
            border: [false, false, false, false],
          },
          {
            table: {
              widths: [90, "*"],
              body: [
                [{ text: "Cliente", bold: true }, { text: nom.material || "—" }],
                [{ text: "Piezas totales", bold: true }, { text: String(totalPieces) }],
                [{ text: "Planchas", bold: true }, { text: String(sheetCount) }],
                [{ text: "Generado", bold: true }, { text: new Date().toLocaleString("es-PE") }],
              ],
            },
            layout: "lightHorizontalLines",
          },
        ],
      ],
    },
    layout: "noBorders",
    margin: [0, 0, 0, 18],
  } as unknown as Content
}

function buildSummaryTable(sheets: NestedSheet[], sheetConfig: SheetConfig) {
  const body = [
    [
      headerCell("Plancha"),
      headerCell("Piezas"),
      headerCell("% Aprov."),
      headerCell("Área usada (m²)"),
      headerCell("Long. corte (m)"),
    ],
    ...sheets.map((sheet, i) => {
      const usage = calculateSheetUsagePercent(sheet, sheetConfig)
      const usedArea = sheet.pieces.reduce((sum, p) => {
        const b = boundingRect(p.outline)
        return sum + b.width * b.height
      }, 0)
      const cutLength = sheet.pieces.reduce((sum, p) => {
        if (!p.subEntities?.length) return sum
        return sum + p.subEntities.reduce((s2, sub) => {
          const pts = sub.outline.points
          let len = 0
          for (let i2 = 0; i2 < pts.length - 1; i2++) len += Math.hypot(pts[i2 + 1].x - pts[i2].x, pts[i2 + 1].y - pts[i2].y)
          return s2 + len
        }, 0)
      }, 0)

      return [
        bodyCell(`#${i + 1}`),
        bodyCell(String(sheet.pieces.length)),
        bodyCell(`${usage.toFixed(1)}%`),
        bodyCell((usedArea / 1_000_000).toFixed(3)),
        bodyCell((cutLength / 1000).toFixed(2)),
      ]
    }),
  ]

  return {
    table: { headerRows: 1, widths: ["*", "*", "*", "*", "*"], body },
    layout: tableLayout(),
    margin: [0, 0, 0, 18],
  } as unknown as Content
}

const PREVIEW_WIDTH = 500
const PREVIEW_HEIGHT = 260

/**
 * Dibuja el contorno de la plancha + cada pieza como polylines
 * vectoriales reales (no una imagen rasterizada) — mismo color que se
 * ve en el canvas del navegador. Escala mm -> pt para que quepa en el
 * recuadro de preview.
 */
function buildSheetPreview(group: SheetGroup, sheetConfig: SheetConfig): Content {
  const scale = Math.min(PREVIEW_WIDTH / sheetConfig.width, PREVIEW_HEIGHT / sheetConfig.height) * 0.95
  const offsetX = (PREVIEW_WIDTH - sheetConfig.width * scale) / 2
  const offsetY = (PREVIEW_HEIGHT - sheetConfig.height * scale) / 2

  const toPt = (p: { x: number; y: number }) => ({
    x: offsetX + p.x * scale,
    y: offsetY + p.y * scale,
  })

  const canvas: CanvasElement[] = [
    {
      type: "rect",
      x: offsetX,
      y: offsetY,
      w: sheetConfig.width * scale,
      h: sheetConfig.height * scale,
      lineColor: "#9CA3AF",
      lineWidth: 0.5,
    },
  ]

  for (const piece of group.sheet.pieces) {
    const entities = piece.subEntities?.length
      ? piece.subEntities
      : [{ outline: piece.outline, color: piece.color }]

    for (const sub of entities) {
      if (sub.outline.points.length < 2) continue
      canvas.push({
        type: "polyline",
        points: sub.outline.points.map(toPt),
        lineColor: sub.color ?? "#22c55e",
        lineWidth: 0.4,
      })
    }
  }

  return {
    stack: [
      {
        text: `${formatSheetRangeLabel(group)}${group.count > 1 ? ` (×${group.count} idénticas)` : ""} — ${group.sheet.pieces.length} piezas`,
        fontSize: 9,
        bold: true,
        margin: [0, 0, 0, 4],
      },
      { canvas },
    ],
    margin: [0, 0, 0, 16],
  } as unknown as Content
}

function buildCatalogTable(sheets: NestedSheet[]) {
  const catalog = buildPieceCatalog(sheets)
  if (catalog.length === 0) return null

  const body = [
    [headerCell("Pieza"), headerCell("Dimensiones"), headerCell("Perímetro"), headerCell("Cantidad")],
    ...catalog.map((c) => [
      bodyCell(c.pieceId, "left"),
      bodyCell(`${c.width.toFixed(0)}×${c.height.toFixed(0)}mm`),
      bodyCell(`${c.perimeter.toFixed(0)}mm`),
      bodyCell(String(c.quantity)),
    ]),
  ]

  return {
    stack: [
      { text: "CATÁLOGO DE PIEZAS (BOM)", fontSize: 12, bold: true, margin: [0, 0, 0, 8] },
      {
        table: { headerRows: 1, widths: ["*", 120, 100, 80], body },
        layout: tableLayout(),
      },
    ],
    margin: [0, 12, 0, 0],
  } as unknown as Content
}

export interface NestingReportOptions {
  nomenclatura: Nomenclatura
  sheets: NestedSheet[]
  sheetConfig: SheetConfig
}

/**
 * Puerto (adaptado) de la Fase 2 de PdfGenerator::generarReporte del
 * original: el layout/dibujo del PDF, que antes había quedado
 * explícitamente fuera de alcance. Ahora corre con pdfmake (ya
 * instalado y usado en /reports), no con QPainter — mismo resultado
 * (reporte visual con las planchas dibujadas), stack distinto.
 */
export async function exportNestingReportPdf({ nomenclatura, sheets, sheetConfig }: NestingReportOptions): Promise<void> {
  ensureFonts()

  const groups = groupIdenticalSheets(sheets)
  const totalPieces = sheets.reduce((sum, s) => sum + s.pieces.length, 0)

  const content: Content[] = [
    buildHeader(nomenclatura, totalPieces, sheets.length),
    divider(),
    { text: "RESUMEN POR PLANCHA", fontSize: 12, bold: true, margin: [0, 0, 0, 8] },
    buildSummaryTable(sheets, sheetConfig),
    { text: "VISTA DE PLANCHAS", fontSize: 12, bold: true, margin: [0, 0, 0, 8] },
    ...groups.map((g) => buildSheetPreview(g, sheetConfig)),
  ]

  const catalogSection = buildCatalogTable(sheets)
  if (catalogSection) content.push(catalogSection)

  const docDefinition: TDocumentDefinitions = {
    pageSize: "A4",
    pageMargins: [24, 24, 24, 24],
    content,
    defaultStyle: { font: "Roboto", fontSize: 8 },
  }

  const fileName = `${buildBaseName(nomenclatura)}-reporte.pdf`

  await pdfMake.createPdf(docDefinition).download(fileName)
}