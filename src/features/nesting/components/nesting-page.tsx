"use client"

import dynamic from "next/dynamic"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Settings2, Info } from "lucide-react"

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
import { SheetNavigator } from "./sheet-navigator"
import { PropertiesPanel, type SheetStats } from "./properties-panel"
import { ExportDialog } from "./export-dialog"
import { PiecePreviewDialog } from "./piece-preview-dialog"
import { EntityExpandedToggle, type EntityExpandedToggleOption } from "@/shared/ui/entity-expanded-row/entity-expanded-toggle"
import { ScrollArea } from "@/components/ui/scroll-area"
import type { PieceRow, ManualRow, CadRow, PieceListHandle } from "./piece-list"
import type { NestingPieceInput } from "../../engineering/components/dxf-canvas"

const DxfCanvas = dynamic(
  () => import("@/features/engineering/components/dxf-canvas").then((m) => m.DxfCanvas),
  { ssr: false }
)

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

type PanelView = "config" | "inspector"
const PANEL_OPTIONS: EntityExpandedToggleOption<PanelView>[] = [
  { value: "config", label: "Configuración", icon: Settings2 },
  { value: "inspector", label: "Propiedades", icon: Info },
]

export function NestingPage() {
  const colorCursorRef = useRef(0)
  const nextColor = useCallback(() => {
    const c = PIECE_COLORS[colorCursorRef.current % PIECE_COLORS.length]
    colorCursorRef.current++
    return c
  }, [])

  const makeEmptyManualRow = useCallback((): ManualRow => ({
    id: `pieza-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    source: "manual",
    width: "",
    height: "",
    quantity: "1",
    color: nextColor(),
  }), [nextColor])

  const [rows, setRows] = useState<PieceRow[]>([])
  const [settings, setSettings] = useState<ProjectSettings>(defaultProjectSettings)
  const [machine, setMachine] = useState<MachineSettings>(defaultMachineSettings)
  const [previewRow, setPreviewRow] = useState<CadRow | null>(null)
  const [activeGroupIndex, setActiveGroupIndex] = useState(0)
  const [selectedPieceIndex, setSelectedPieceIndex] = useState<number | null>(null)
  const [exportDialogOpen, setExportDialogOpen] = useState(false)
  const [activePanel, setActivePanel] = useState<PanelView>("config")

  const projectInputRef = useRef<HTMLInputElement>(null)
  const pieceListRef = useRef<PieceListHandle>(null)

  const { status, progress, sheets, error, run, cancel } = useNesting()
  const isRunning = status === "running"

  const sheetConfig: SheetConfig = useMemo(() => ({
    width: Number(settings.sheetWidth) || 1000,
    height: Number(settings.sheetHeight) || 600,
    margin: Number(settings.margin) || 0,
  }), [settings.sheetWidth, settings.sheetHeight, settings.margin])

  const sheetGroups = useMemo(() => (sheets ? groupIdenticalSheets(sheets) : []), [sheets])

  useEffect(() => {
    if (sheetGroups.length > 0) {
      setActiveGroupIndex(0)
      setSelectedPieceIndex(null)
    }
  }, [sheetGroups.length])

  useEffect(() => {
    if (selectedPieceIndex !== null) {
      setActivePanel("inspector")
    }
  }, [selectedPieceIndex])

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

  const activeGroup = sheetGroups[activeGroupIndex] ?? null
  const canvasPieces: PlacedPiece[] = activeGroup ? activeGroup.sheet.pieces : []

  const dxfCanvasPieces: NestingPieceInput[] = useMemo(
    () =>
      canvasPieces.map((p) => ({
        subOutlines: p.subEntities?.length
          ? p.subEntities.map((s) => ({ points: s.outline.points, color: s.color }))
          : [],
        outline: p.outline.points,
        angle: p.angle,
      })),
    [canvasPieces]
  )

  const sheetStats: SheetStats | null = useMemo(() => {
    if (!activeGroup) return null
    return {
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
  }, [activeGroup, sheetConfig])

  const selectedPiece = selectedPieceIndex !== null ? canvasPieces[selectedPieceIndex] ?? null : null

  const handleAddManual = useCallback(() => setRows((prev) => [...prev, makeEmptyManualRow()]), [makeEmptyManualRow])
  const handleRemove = useCallback((id: string) => setRows((prev) => (prev.length > 1 ? prev.filter((r) => r.id !== id) : prev)), [])
  const handleUpdateManual = useCallback((id: string, patch: Partial<ManualRow>) =>
    setRows((prev) => prev.map((r) => (r.id === id && r.source === "manual" ? { ...r, ...patch } : r))), [])
  const handleUpdateQuantity = useCallback((id: string, quantity: string) => 
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, quantity } : r))), [])
  const handleAddCad = useCallback((newRows: CadRow[]) => setRows((prev) => [...prev, ...newRows]), [])

  const handleRun = useCallback(() => {
    if (!canRun) return
    run(validPieces, { sheet: sheetConfig })
  }, [canRun, run, validPieces, sheetConfig])

  const handleExportSheet = useCallback((format: "dxf" | "nsp", sheetIndex: number) => {
    if (!sheets) return
    const sheet = sheets[sheetIndex]
    const fileName = buildSheetFileName(
      { anio: "00", proyecto: settings.proyecto || "S", lote: "1", material: settings.material || "MAT", espesor: settings.espesor || "0" },
      sheet.pieces.length,
      sheetIndex
    )
    if (format === "dxf") downloadTextFile(`${fileName}.dxf`, generateSheetDxf(sheet, sheetConfig), "application/dxf")
    else downloadTextFile(`${fileName}.nsp`, generateSheetNsp(sheet, sheetConfig), "application/xml")
  }, [sheets, settings, sheetConfig])

  const handleSaveProject = useCallback(() => {
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
  }, [rows, sheetConfig])

  const handleOpenProjectFile = useCallback(async (file: File | undefined) => {
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
      console.error(err instanceof ProjectFileParseError ? err.message : "Proyecto inválido")
    }
  }, [])

  const handleNewProject = useCallback(() => {
    setRows([])
    setSettings(defaultProjectSettings())
    setMachine(defaultMachineSettings())
    setSelectedPieceIndex(null)
    setPreviewRow(null)
  }, [])

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
        onToggleLayers={() => {}}
        onSettings={() => {}}
      />

      <div className="flex min-h-0 flex-1 gap-4 bg-neutral-950 p-4">
        {/* PANEL LATERAL ESTRECHO Y COMPACTO (w-72 exacto controlado por el contenedor) */}
        <div className="flex w-72 shrink-0 flex-col gap-3">
          <EntityExpandedToggle
            value={activePanel}
            onChange={setActivePanel}
            options={PANEL_OPTIONS}
          />

          <div className="min-h-0 flex-1 overflow-hidden">
            {activePanel === "config" ? (
              <ScrollArea className="h-full w-full pr-1">
                <Sidebar
                  ref={pieceListRef}
                  settings={settings}
                  onSettingsChange={(patch) => setSettings((s) => ({ ...s, ...patch }))}
                  machine={machine}
                  onMachineChange={(patch) => setMachine((m) => ({ ...m, ...patch }))}
                  pieceListProps={{
                    rows,
                    conflictIds,
                    disabled: isRunning,
                    onAddManual: handleAddManual,
                    onAddCad: handleAddCad,
                    onRemove: handleRemove,
                    onUpdateManual: handleUpdateManual,
                    onUpdateQuantity: handleUpdateQuantity,
                    onPreviewRow: setPreviewRow,
                    nextColor,
                  }}
                  canRun={canRun}
                  isRunning={isRunning}
                  progress={progress}
                  error={error}
                  onRun={handleRun}
                  onCancel={cancel}
                />
              </ScrollArea>
            ) : (
              <ScrollArea className="h-full w-full rounded-xl border border-white/10 bg-white/[0.02] p-3">
                <PropertiesPanel 
                  sheetStats={sheetStats} 
                  selectedPiece={selectedPiece} 
                  espesor={settings.espesor} 
                  material={settings.material} 
                />
              </ScrollArea>
            )}
          </div>
        </div>

        {/* CANVAS — flexible y fluido */}
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

          <div className="min-h-[500px] flex-1 overflow-hidden rounded-2xl border border-white/10 bg-neutral-900/50">
            {canvasPieces.length > 0 ? (
              <DxfCanvas
                pieces={dxfCanvasPieces}
                sheetSize={{ width: sheetConfig.width, height: sheetConfig.height }}
                selectedPieceIndex={selectedPieceIndex}
                onSelectPiece={setSelectedPieceIndex}
              />
            ) : (
              <div className="flex h-full items-center justify-center px-8 text-center text-sm text-neutral-500">
                Importa una pieza o presiona Nestear para verla acá.
              </div>
            )}
          </div>
        </div>
      </div>

      <ExportDialog
        open={exportDialogOpen}
        onClose={() => setExportDialogOpen(false)}
        sheetGroups={sheetGroups}
        onExportSheet={handleExportSheet}
        onSaveProject={handleSaveProject}
      />

      <PiecePreviewDialog row={previewRow} onClose={() => setPreviewRow(null)} />
    </div>
  )
}