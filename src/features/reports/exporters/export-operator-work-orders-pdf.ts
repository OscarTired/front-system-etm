import pdfMake from "pdfmake/build/pdfmake"

import type { Content, TDocumentDefinitions } from "pdfmake/interfaces"

import type { ReportModel } from "../types/report-model.types"

import { getWorkflowStatusLabel } from "@/features/workflow/utils/get-workflow-status-label"

let fontsRegistered = false

function ensureFonts(): void {
  if (fontsRegistered) {
    return
  }

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

function formatDate(value: string | null): string {
  if (!value) return "—"
  const day = value.slice(0, 10)
  const [y, m, d] = day.split("-").map(Number)
  if (!y || !m || !d) return "—"
  const local = new Date(y, m - 1, d, 12)
  return local.toLocaleDateString("es-PE")
}

/**
 * Layout de tabla con líneas de grid completas (horizontales y
 * verticales) y bandeado de filas para lectura formal tipo "cuadro".
 */
function gridLayout() {
  return {
    hLineWidth: () => 0.6,
    vLineWidth: () => 0.6,
    hLineColor: () => "#D1D5DB",
    vLineColor: () => "#D1D5DB",
    fillColor: (rowIndex: number) =>
      rowIndex === 0 ? "#1F2937" : rowIndex % 2 === 0 ? "#F3F4F6" : null,
    paddingLeft: () => 6,
    paddingRight: () => 6,
    paddingTop: () => 4,
    paddingBottom: () => 4,
  }
}

function headerCell(text: string): Content {
  return { text, style: "tableHeader", alignment: "center" }
}

function textCell(text: string): Content {
  return { text, alignment: "left" }
}

function numCell(text: string): Content {
  return { text, alignment: "center" }
}

export async function exportOperatorWorkOrdersPdf(
  report: ReportModel,
  fileName = "ordenes-trabajo",
): Promise<void> {
  ensureFonts()

  const content: Content[] = []

  content.push({ text: "REPORTE DE PRODUCCIÓN", style: "title" })

  content.push({
    text: `Generado: ${new Date().toLocaleString("es-PE")}`,
    margin: [0, 0, 0, 14],
    color: "#666666",
  })

  content.push({
    table: {
      headerRows: 1,
      widths: ["*", 120],
      body: [
        [headerCell("Indicador"), headerCell("Valor")],
        [textCell("Total tareas"), numCell(String(report.kpis.totalTasks))],
        [textCell("Total proyectos"), numCell(String(report.kpis.totalProjects))],
        [textCell("Operadores"), numCell(String(report.kpis.totalOperators))],
        [textCell("Procesos"), numCell(String(report.kpis.totalProcesses))],
        [textCell("Piezas esperadas"), numCell(String(report.kpis.totalPiecesExpected))],
        [textCell("Piezas producidas"), numCell(String(report.kpis.totalPiecesOutput))],
        [textCell("Tiempo total (min)"), numCell(String(report.kpis.totalDurationMinutes))],
        [textCell("Productividad"), numCell(String(report.kpis.productivity))],
      ],
    },
    layout: gridLayout(),
    margin: [0, 0, 0, 14],
  })

  for (const operator of report.operators) {
    content.push({
      text: operator.operatorName,
      style: "operatorHeader",
      pageBreak: "before",
    })

    content.push({
      text: `Pasos asignados: ${operator.summary.stepsAssigned}   |   Completados: ${operator.summary.stepsCompleted}   |   Tiempo: ${operator.summary.totalDurationMinutes} min`,
      margin: [0, 0, 0, 8],
    })

    content.push({
      table: {
        headerRows: 1,
        widths: ["auto", "*", "auto", "auto", "auto", "auto"],
        body: [
          [
            headerCell("Tarea #"),
            headerCell("Referencia"),
            headerCell("Proceso"),
            headerCell("Piezas"),
            headerCell("Entrega"),
            headerCell("Estado"),
          ],
          ...operator.rows.map((row) => [
            numCell(String(row.taskNumber)),
            textCell(row.reference),
            textCell(row.processLabel),
            numCell(String(row.piecesExpected)),
            numCell(formatDate(row.deliveryDate)),
            numCell(getWorkflowStatusLabel(row.status)),
          ]),
        ],
      },
      layout: gridLayout(),
      margin: [0, 0, 0, 14],
    })

    content.push({
      text: "Resumen por Proyecto",
      style: "sectionHeader",
      margin: [0, 12, 0, 6],
    })

    content.push({
      table: {
        headerRows: 1,
        widths: ["*", "*", "auto", "auto", "auto", "auto"],
        body: [
          [
            headerCell("Proyecto"),
            headerCell("Cliente"),
            headerCell("Tareas"),
            headerCell("Operadores"),
            headerCell("Completados"),
            headerCell("Tiempo"),
          ],
          ...report.projects.map((project) => [
            textCell(project.projectName),
            textCell(project.clientName),
            numCell(String(project.tasks)),
            numCell(String(project.operators)),
            numCell(String(project.completed + project.reviewed)),
            numCell(`${project.totalDurationMinutes} min`),
          ]),
        ],
      },
      layout: gridLayout(),
      margin: [0, 0, 0, 14],
    })

    content.push({
      text: "Resumen por Proceso",
      style: "sectionHeader",
      margin: [0, 12, 0, 6],
    })

    content.push({
      table: {
        headerRows: 1,
        widths: ["*", "auto", "auto", "auto", "auto", "auto"],
        body: [
          [
            headerCell("Proceso"),
            headerCell("Operadores"),
            headerCell("Tareas"),
            headerCell("Completadas"),
            headerCell("Tiempo"),
            headerCell("Piezas"),
          ],
          ...report.processes.map((process) => [
            textCell(process.processLabel),
            numCell(String(process.operators)),
            numCell(String(process.tasks)),
            numCell(String(process.completed + process.reviewed)),
            numCell(`${process.totalDurationMinutes} min`),
            numCell(String(process.totalPiecesOutput)),
          ]),
        ],
      },
      layout: gridLayout(),
      margin: [0, 0, 0, 8],
    })
  }

  const docDefinition: TDocumentDefinitions = {
    pageOrientation: "landscape",
    pageSize: "A4",
    pageMargins: [24, 24, 24, 24],
    content,
    styles: {
      title: {
        fontSize: 20,
        bold: true,
        margin: [0, 0, 0, 8],
      },
      sectionHeader: {
        fontSize: 13,
        bold: true,
      },
      operatorHeader: {
        fontSize: 14,
        bold: true,
        margin: [0, 0, 0, 6],
      },
      tableHeader: {
        bold: true,
        color: "white",
      },
    },
    defaultStyle: {
      font: "Roboto",
      fontSize: 8,
    },
  }

  await pdfMake
    .createPdf(docDefinition)
    .download(`${fileName}-${new Date().toISOString().slice(0, 10)}.pdf`)
}