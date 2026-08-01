"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"

import { useNesting } from "../hooks/use-nesting"
import { boundingRect } from "../engine/geometry"
import type { NestingPiece, PieceOutline, PlacedPiece, SheetConfig } from "../engine/types"
import { auditMaterials, type AuditablePiece } from "../cad/material-audit"
import { calculateSheetUsagePercent } from "../engine/sheet-usage"
import { groupIdenticalSheets, formatSheetRangeLabel } from "../utils/svg-render"
import { buildSheetFileName } from "../export/nomenclatura"
import { generateSheetDxf } from "../export/dxf-export"
import { generateSheetNsp } from "../export/nsp-export"
import { serializeProject, parseProjectFile, ProjectFileParseError, type ProjectPieceEntry } from "../export/project-file"
import { defaultProjectSettings, defaultMachineSettings, type ProjectSettings, type MachineSettings } from "../types/project-settings"

import { Toolbar } from "./toolbar"
import { Sidebar } from "./sidebar"
import { NestingCanvas, type NestingCanvasHandle } from "./nesting-canvas"
import { SheetNavigator } from "./sheet-navigator"
import { PropertiesPanel, type SheetStats } from "./properties-panel"
import { ExportDialog } from "./export-dialog"
import type { PieceRow, ManualRow, CadRow, PieceListHandle } from "./piece-list"

const PIECE_COLORS = ["#22c55e", "#f97316", "#3b82f6", "#eab308", "#ec4899", "#a855f7"]

function rectOutline(w: number, h: number): PieceOutline {
  return {
    points: [
      { x: 0, y: 0 },
      { x: w, y: 0 },
      { x: w, y: h },
      { x: 0, y: h },
    ],
  }
}

function downloadTextFile(fileName: string, content: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = fileName
  a.click()
  URL.revokeObjectURL(url)
}

/** Envuelve una pieza SIN nestear como si fuera una PlacedPiece en (0,0,0°), para poder mostrarla en el mismo NestingCanvas antes de correr el nesting — sin generar ningún DXF de por medio. */
function pieceAsPreview(piece: NestingPiece): { placed: PlacedPiece; width: number; height: number } {
  const bounds = boundingRect(piece.outline)
  return {
    placed: { pieceId: piece.id, x: 0, y: 0, angle: 0, outline: piece.outline, subEntities: piece.subEntities, color: piece.color },
    width: bounds.width,
    height: bounds.height,
  }
}

export function NestingPage() {
  const colorCursorRef = useRef(0)
  const nextColor = useCallback(() => {
    const c = PIECE_COLORS[colorCursorRef.current % PIECE_COLORS.length]
    colorCursorRef.current++
    return c
  }, [])

  const makeEmptyManualRow = useCallback((): ManualRow => {
    return {
      id: `pieza-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      source: "manual",
      width: "",
      height: "",
      quantity: "1",
      color: nextColor(),
    }
  }, [nextColor])

  const [rows, setRows] = useState<PieceRow[]>(() => [])
  const [settings, setSettings] = useState<ProjectSettings>(defaultProjectSettings)
  const [machine, setMachine] = useState<MachineSettings>(defaultMachineSettings)
  const [selectedRowId, setSelectedRowId] = useState<string | null>(null)
  const [previewPiece, setPreviewPiece] = useState<NestingPiece | null>(null)
  const [activeGroupIndex, setActiveGroupIndex] = useState(0)
  const [selectedPieceIndex, setSelectedPieceIndex] = useState<number | null>(null)
  const [exportDialogOpen, setExportDialogOpen] = useState(false)

  const projectInputRef = useRef<HTMLInputElement>(null)
  const canvasRef = useRef<NestingCanvasHandle>(null)
  const pieceListRef = useRef<PieceListHandle>(null)

  const { status, progress, sheets, error, run, cancel } = useNesting()
  const isRunning = status === "running"

  const sheetConfig: SheetConfig = {
    width: Number(settings.sheetWidth) || 1000,
    height: Number(settings.sheetHeight) || 600,
    margin: Number(settings.margin) || 0,
  }

  const sheetGroups = useMemo(() => (sheets ? groupIdenticalSheets(sheets) : []), [sheets])

  // Apenas hay resultado, mostramos la primera plancha — nunca hace
  // falta un click extra para ver lo que importa.
  useEffect(() => {
    if (sheetGroups.length > 0) {
      setActiveGroupIndex(0)
      setPreviewPiece(null)
      setSelectedPieceIndex(null)
    }
  }, [sheetGroups.length])

  const validPieces = useMemo<NestingPiece[]>(() => {
    const pieces: NestingPiece[] = []
    for (const row of rows) {
      const quantity = Number(row.quantity) || 1
      if (row.source === "manual") {
        const w = Number(row.width)
        const h = Number(row.height)
        if (w > 0 && h > 0) pieces.push({ id: row.id, outline: rectOutline(w, h), quantity, color: row.color })
      } else {
        pieces.push({ id: row.id, outline: row.outline, subEntities: row.subEntities, quantity, color: row.color })
      }
    }
    return pieces
  }, [rows])

  const materialAudit = useMemo(() => {
    const auditable: AuditablePiece[] = rows
      .filter((r): r is CadRow => r.source === "cad" && r.material.thickness > 0)
      .map((r) => ({ id: r.id, material: r.material }))
    return auditable.length > 1 ? auditMaterials(auditable) : null
  }, [rows])

  const conflictIds = useMemo(() => {
    if (!materialAudit) return new Set<string>()
    return new Set(materialAudit.results.filter((r) => r.hasConflict).map((r) => r.id))
  }, [materialAudit])

  const canRun = validPieces.length > 0 && !isRunning

  // --- Datos que le llegan al canvas: o la plancha activa nesteada, o el preview de una pieza suelta ---
  const activeGroup = sheetGroups[activeGroupIndex] ?? null
  const canvasPieces: PlacedPiece[] = activeGroup ? activeGroup.sheet.pieces : previewPiece ? [pieceAsPreview(previewPiece).placed] : []
  const canvasWidth = activeGroup ? sheetConfig.width : previewPiece ? pieceAsPreview(previewPiece).width : sheetConfig.width
  const canvasHeight = activeGroup ? sheetConfig.height : previewPiece ? pieceAsPreview(previewPiece).height : sheetConfig.height

  const sheetStats: SheetStats | null = activeGroup
    ? {
        pieceCount: activeGroup.sheet.pieces.length,
        usagePercent: calculateSheetUsagePercent(activeGroup.sheet, sheetConfig),
        sheetArea: sheetConfig.width * sheetConfig.height,
        usedArea: activeGroup.sheet.pieces.reduce((sum, p) => {
          const b = boundingRect(p.outline)
          return sum + b.width * b.height
        }, 0),
        totalCutLength: activeGroup.sheet.pieces.reduce((sum, p) => {
          if (!p.subEntities?.length) return sum
          return sum + p.subEntities.reduce((s2, sub) => {
            const pts = sub.outline.points
            let len = 0
            for (let i = 0; i < pts.length - 1; i++) len += Math.hypot(pts[i + 1].x - pts[i].x, pts[i + 1].y - pts[i].y)
            return s2 + len
          }, 0)
        }, 0),
      }
    : null

  const selectedPiece = selectedPieceIndex !== null ? canvasPieces[selectedPieceIndex] ?? null : null

  // --- Handlers de piezas ---
  const handleAddManual = () => setRows((prev) => [...prev, makeEmptyManualRow()])
  const handleRemove = (id: string) => setRows((prev) => (prev.length > 1 ? prev.filter((r) => r.id !== id) : prev))
  const handleUpdateManual = (id: string, patch: Partial<ManualRow>) =>
    setRows((prev) => prev.map((r) => (r.id === id && r.source === "manual" ? { ...r, ...patch } : r)))
  const handleUpdateQuantity = (id: string, quantity: string) => setRows((prev) => prev.map((r) => (r.id === id ? { ...r, quantity } : r)))
  const handleAddCad = (newRows: CadRow[]) => {
    setRows((prev) => [...prev, ...newRows])
    setSelectedRowId(newRows[0].id)
    setPreviewPiece({ id: newRows[0].fileName, outline: newRows[0].outline, subEntities: newRows[0].subEntities, color: newRows[0].color })
  }
  const handleSelectRow = (row: CadRow) => {
    setSelectedRowId(row.id)
    setPreviewPiece({ id: row.fileName, outline: row.outline, subEntities: row.subEntities, color: row.color })
  }

  // --- Nestear ---
  const handleRun = () => {
    if (!canRun) return
    setPreviewPiece(null)
    run(validPieces, { sheet: sheetConfig })
  }

  // --- Exportar ---
  const handleExportSheet = (format: "dxf" | "nsp", sheetIndex: number) => {
    if (!sheets) return
    const sheet = sheets[sheetIndex]
    const fileName = buildSheetFileName(
      { anio: "00", proyecto: settings.proyecto || "S", lote: "1", material: settings.material || "MAT", espesor: settings.espesor || "0" },
      sheet.pieces.length,
      sheetIndex
    )
    if (format === "dxf") downloadTextFile(`${fileName}.dxf`, generateSheetDxf(sheet, sheetConfig), "application/dxf")
    else downloadTextFile(`${fileName}.nsp`, generateSheetNsp(sheet, sheetConfig), "application/xml")
  }

  // --- Proyecto (guardar/abrir) ---
  const handleSaveProject = () => {
    const pieces: ProjectPieceEntry[] = rows.map((row) =>
      row.source === "manual"
        ? {
            id: row.id,
            source: "manual",
            width: Number(row.width) || 0,
            height: Number(row.height) || 0,
            quantity: Number(row.quantity) || 1,
            color: row.color,
            outline: rectOutline(Number(row.width) || 0, Number(row.height) || 0),
          }
        : {
            id: row.id,
            source: "cad",
            fileName: row.fileName,
            width: row.width,
            height: row.height,
            quantity: Number(row.quantity) || 1,
            color: row.color,
            outline: row.outline,
            subEntities: row.subEntities,
            material: row.material,
          }
    )
    const json = serializeProject({ sheet: sheetConfig, pieces })
    downloadTextFile(`nesting-proyecto-${Date.now()}.json`, json, "application/json")
  }

  const handleOpenProjectFile = async (file: File | undefined) => {
    if (!file) return
    try {
      const text = await file.text()
      const project = parseProjectFile(text)
      setSettings((s) => ({ ...s, sheetWidth: String(project.sheet.width), sheetHeight: String(project.sheet.height), margin: String(project.sheet.margin) }))
      const loadedRows: PieceRow[] = project.pieces.map((p) =>
        p.source === "manual"
          ? { id: p.id, source: "manual", width: String(p.width), height: String(p.height), quantity: String(p.quantity), color: p.color }
          : {
              id: p.id,
              source: "cad",
              fileName: p.fileName ?? "pieza.dxf",
              outline: p.outline,
              subEntities: p.subEntities ?? [],
              width: p.width,
              height: p.height,
              quantity: String(p.quantity),
              color: p.color,
              material: p.material ?? { thickness: -1, dinNorm: "N/D", alloy: "N/D" },
            }
      )
      setRows(loadedRows)
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error(err instanceof ProjectFileParseError ? err.message : "Proyecto inválido")
    }
  }

  const handleNewProject = () => {
    setRows([])
    setSettings(defaultProjectSettings())
    setMachine(defaultMachineSettings())
    setPreviewPiece(null)
    setSelectedPieceIndex(null)
  }

  return (
    <div className="flex h-full min-h-[720px] flex-col overflow-hidden">
      <input
        ref={projectInputRef}
        type="file"
        accept=".json"
        className="hidden"
        onChange={(e) => {
          void handleOpenProjectFile(e.target.files?.[0])
          e.target.value = ""
        }}
      />

      <Toolbar
        onNew={handleNewProject}
        onOpen={() => projectInputRef.current?.click()}
        onSave={handleSaveProject}
        onImport={() => pieceListRef.current?.triggerImport()}
        onExport={() => setExportDialogOpen(true)}
        onAutoNest={handleRun}
        onCancel={cancel}
        onRecalculate={handleRun}
        onZoomIn={() => canvasRef.current?.zoomIn()}
        onZoomOut={() => canvasRef.current?.zoomOut()}
        onFit={() => canvasRef.current?.fitToView()}
        onToggleLayers={() => {}}
        onSettings={() => {}}
        isRunning={isRunning}
        canRun={canRun}
      />

      <div className="flex min-h-0 flex-1 gap-4 bg-[#050505] p-4">
        <Sidebar
          ref={pieceListRef}
          settings={settings}
          onSettingsChange={(patch) => setSettings((s) => ({ ...s, ...patch }))}
          machine={machine}
          onMachineChange={(patch) => setMachine((m) => ({ ...m, ...patch }))}
          pieceListProps={{
            rows,
            selectedRowId,
            conflictIds,
            disabled: isRunning,
            onAddManual: handleAddManual,
            onAddCad: handleAddCad,
            onRemove: handleRemove,
            onUpdateManual: handleUpdateManual,
            onUpdateQuantity: handleUpdateQuantity,
            onSelectRow: handleSelectRow,
            nextColor,
          }}
          canRun={canRun}
          isRunning={isRunning}
          progress={progress}
          error={error}
          onRun={handleRun}
          onCancel={cancel}
        />

        {/* CANVAS — único, siempre centrado, protagonista */}
        <div className="flex min-h-0 flex-1 flex-col gap-2">
          {sheetGroups.length > 0 && (
            <SheetNavigator
              currentIndex={activeGroupIndex}
              totalSheets={sheetGroups.length}
              label={
                sheetGroups[activeGroupIndex]
                  ? `${formatSheetRangeLabel(sheetGroups[activeGroupIndex])}${sheetGroups[activeGroupIndex].count > 1 ? ` ×${sheetGroups[activeGroupIndex].count}` : ""}`
                  : ""
              }
              onChange={(i) => {
                setActiveGroupIndex(i)
                setSelectedPieceIndex(null)
              }}
            />
          )}

          <div className="min-h-[500px] flex-1 overflow-hidden rounded-2xl border border-white/8">
            {canvasPieces.length > 0 ? (
              <NestingCanvas
                ref={canvasRef}
                sheetWidth={canvasWidth}
                sheetHeight={canvasHeight}
                pieces={canvasPieces}
                selectedPieceIndex={selectedPieceIndex}
                onSelectPiece={setSelectedPieceIndex}
              />
            ) : (
              <div className="flex h-full items-center justify-center bg-[#0a0a0c] px-8 text-center text-sm text-neutral-600">
                Importa una pieza o presiona Nestear para verla acá.
              </div>
            )}
          </div>
        </div>

        {/* Inspector */}
        <div className="w-[280px] shrink-0 overflow-y-auto rounded-2xl border border-white/8 bg-white/[0.03] p-3">
          <PropertiesPanel sheetStats={sheetStats} selectedPiece={selectedPiece} espesor={settings.espesor} material={settings.material} />
        </div>
      </div>

      <ExportDialog
        open={exportDialogOpen}
        onClose={() => setExportDialogOpen(false)}
        sheetGroups={sheetGroups}
        onExportSheet={handleExportSheet}
        onSaveProject={handleSaveProject}
      />
    </div>
  )
}