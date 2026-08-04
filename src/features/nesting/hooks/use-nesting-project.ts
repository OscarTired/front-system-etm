import { useCallback, useMemo, useRef, useState } from "react"

import { useNesting } from "./use-nesting"
import {
  boundingRect,
  rotateOutlineAroundPoint,
  mirrorOutlineXAroundPoint,
  mirrorOutlineYAroundPoint,
} from "../engine/geometry"
import type { NestingPiece, NestedSheet, SheetConfig, PieceOutline, Point2D } from "../engine/types"
import { auditMaterials, type AuditablePiece } from "../cad/material-audit"
import { calculateSheetUsagePercent } from "../engine/sheet-usage"
import { groupIdenticalSheets } from "../utils/svg-render"
import { buildSheetFileName, type Nomenclatura } from "../export/nomenclatura"
import { generateSheetDxf, type BridgeSettings } from "../export/dxf-export"
import { generateSheetNsp } from "../export/nsp-export"
import { serializeProject, parseProjectFile, ProjectFileParseError, type ProjectPieceEntry } from "../export/project-file"
import { defaultProjectSettings, defaultMachineSettings, type ProjectSettings, type MachineSettings } from "../types/project-settings"
import { downloadTextFile } from "../utils/file-helpers"
import type { PieceRow, CadRow } from "../components/piece-list"
import type { SheetStats } from "../components/properties-panel"

const PIECE_COLORS = ["#22c55e", "#f97316", "#3b82f6", "#eab308", "#ec4899", "#a855f7"]

function cutLengthOf(pieces: { subEntities?: { outline: { points: { x: number; y: number }[] } }[] }[]): number {
  return pieces.reduce((sum, p) => {
    if (!p.subEntities?.length) return sum
    return sum + p.subEntities.reduce((s2, sub) => {
      const pts = sub.outline.points
      let len = 0
      for (let i = 0; i < pts.length - 1; i++) len += Math.hypot(pts[i + 1].x - pts[i].x, pts[i + 1].y - pts[i].y)
      return s2 + len
    }, 0)
  }, 0)
}

/** Bbox de outline principal + todas las sub-entidades (pivote compartido). */
function boundsOfPiece(
  outline: PieceOutline,
  subEntities: { outline: PieceOutline }[]
) {
  const points: Point2D[] = [
    ...outline.points,
    ...subEntities.flatMap((s) => s.outline.points),
  ]
  return boundingRect({ points })
}

export function useNestingProject() {
  const colorCursorRef = useRef(0)
  const nextColor = useCallback(() => {
    const c = PIECE_COLORS[colorCursorRef.current % PIECE_COLORS.length]
    colorCursorRef.current++
    return c
  }, [])

  const [rows, setRows] = useState<PieceRow[]>([])
  const [settings, setSettings] = useState<ProjectSettings>(defaultProjectSettings)
  const [machine, setMachine] = useState<MachineSettings>(defaultMachineSettings)

  const handleSettingsChange = useCallback(
    (patch: Partial<ProjectSettings>) => setSettings((s) => ({ ...s, ...patch })),
    []
  )
  const handleMachineChange = useCallback(
    (patch: Partial<MachineSettings>) => setMachine((m) => ({ ...m, ...patch })),
    []
  )

  const { status, progress, sheets, error, run, cancel } = useNesting()
  const isRunning = status === "running"

  const sheetConfig: SheetConfig = useMemo(() => ({
    width: Number(settings.sheetWidth) || 1000,
    height: Number(settings.sheetHeight) || 600,
    margin: Number(settings.margin) || 0,
  }), [settings.sheetWidth, settings.sheetHeight, settings.margin])

  const defaultBridgeSettings: BridgeSettings = useMemo(() => ({
    enabled: settings.puentesHabilitado,
    count: Number(settings.puentesCantidad) || 0,
    widthMm: Number(settings.puentesAncho) || 0,
  }), [settings.puentesHabilitado, settings.puentesCantidad, settings.puentesAncho])

  const sheetGroups = useMemo(() => (sheets ? groupIdenticalSheets(sheets) : []), [sheets])

  const validPieces = useMemo<NestingPiece[]>(() => {
    const pieces: NestingPiece[] = []
    for (const row of rows) {
      const quantity = Number(row.quantity) || 1
      const thicknessMm =
        row.source === "cad" && row.material?.thickness > 0
          ? row.material.thickness
          : undefined
      pieces.push({
        id: row.id,
        outline: row.outline,
        subEntities: row.subEntities,
        quantity,
        color: row.color,
        thicknessMm,
      })
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

  const nomenclatura: Nomenclatura = useMemo(
    () => ({ anio: "00", proyecto: settings.proyecto || "S", lote: "1", material: settings.material || "MAT", espesor: settings.espesor || "0" }),
    [settings.proyecto, settings.material, settings.espesor]
  )

  const getSheetStats = useCallback((groupIndex: number): SheetStats | null => {
    const group = sheetGroups[groupIndex]
    if (!group) return null
    return {
      pieceCount: group.sheet.pieces.length,
      usagePercent: calculateSheetUsagePercent(group.sheet, sheetConfig),
      sheetArea: sheetConfig.width * sheetConfig.height,
      usedArea: group.sheet.pieces.reduce((sum, p) => {
        const b = boundingRect(p.outline)
        return sum + b.width * b.height
      }, 0),
      totalCutLength: cutLengthOf(group.sheet.pieces),
    }
  }, [sheetGroups, sheetConfig])

  const handleRemove = useCallback((id: string) => setRows((prev) => prev.filter((r) => r.id !== id)), [])
  const handleClearAll = useCallback(() => setRows([]), [])
  const handleUpdateQuantity = useCallback((id: string, quantity: string) =>
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, quantity } : r))), [])
  const handleAddCad = useCallback((newRows: CadRow[]) => setRows((prev) => [...prev, ...newRows]), [])

  const transformRow = useCallback(
    (id: string, transform: (o: PieceOutline, pivot: Point2D) => PieceOutline) => {
      setRows((prev) =>
        prev.map((r) => {
          if (r.id !== id) return r
          const b = boundsOfPiece(r.outline, r.subEntities)
          const pivot: Point2D = {
            x: b.x + b.width / 2,
            y: b.y + b.height / 2,
          }
          const outline = transform(r.outline, pivot)
          const subEntities = r.subEntities.map((sub) => ({
            ...sub,
            outline: transform(sub.outline, pivot),
          }))
          const bounds = boundsOfPiece(outline, subEntities)
          return {
            ...r,
            outline,
            subEntities,
            width: bounds.width,
            height: bounds.height,
          }
        })
      )
    },
    []
  )

  const handleRotate = useCallback((id: string, degrees: number) => {
    transformRow(id, (o, pivot) => rotateOutlineAroundPoint(o, degrees, pivot))
  }, [transformRow])

  const handleMirrorX = useCallback((id: string) => {
    transformRow(id, (o, pivot) => mirrorOutlineXAroundPoint(o, pivot.x))
  }, [transformRow])

  const handleMirrorY = useCallback((id: string) => {
    transformRow(id, (o, pivot) => mirrorOutlineYAroundPoint(o, pivot.y))
  }, [transformRow])

  const handleDuplicate = useCallback((id: string) => {
    setRows((prev) => {
      const source = prev.find((r) => r.id === id)
      if (!source) return prev
      const copy: CadRow = { ...source, id: `cad-${Date.now()}-${Math.random().toString(36).slice(2, 7)}` }
      const idx = prev.findIndex((r) => r.id === id)
      return [...prev.slice(0, idx + 1), copy, ...prev.slice(idx + 1)]
    })
  }, [])

  const handleRun = useCallback(() => {
      if (validPieces.length === 0 || isRunning) return
      // fast = AABB + esquinas + calados (rápido). precise = grilla polígono (lento, no usar en UI).
      run(validPieces, {
        sheet: sheetConfig,
        mode: "fast",
        separation: Number(settings.separacion) || 0,
        rotationMode: settings.rotacionPermitida,
      })
    }, [validPieces, isRunning, run, sheetConfig, settings.separacion, settings.rotacionPermitida])

  const handleExportSheet = useCallback((format: "dxf" | "nsp", sheetIndex: number, bridges?: BridgeSettings) => {
    if (!sheets) return
    const sheet = sheets[sheetIndex]
    const fileName = buildSheetFileName(nomenclatura, sheet.pieces.length, sheetIndex)
    if (format === "dxf") downloadTextFile(`${fileName}.dxf`, generateSheetDxf(sheet, sheetConfig, bridges ?? defaultBridgeSettings), "application/dxf")
    else downloadTextFile(`${fileName}.nsp`, generateSheetNsp(sheet, sheetConfig), "application/xml")
  }, [sheets, nomenclatura, sheetConfig, defaultBridgeSettings])

  const exportMaterializedSheet = useCallback((format: "dxf" | "nsp", sheet: NestedSheet, sheetIndex: number, bridges?: BridgeSettings) => {
    const fileName = buildSheetFileName(nomenclatura, sheet.pieces.length, sheetIndex)
    if (format === "dxf") downloadTextFile(`${fileName}.dxf`, generateSheetDxf(sheet, sheetConfig, bridges ?? defaultBridgeSettings), "application/dxf")
    else downloadTextFile(`${fileName}.nsp`, generateSheetNsp(sheet, sheetConfig), "application/xml")
  }, [nomenclatura, sheetConfig, defaultBridgeSettings])

  const handleSaveProject = useCallback(() => {
    const pieces: ProjectPieceEntry[] = rows.map((row) => ({
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
    }))
    const json = serializeProject({ sheet: sheetConfig, pieces })
    downloadTextFile(`nesting-proyecto-${Date.now()}.json`, json, "application/json")
  }, [rows, sheetConfig])

  const handleOpenProjectFile = useCallback(async (file: File | undefined) => {
    if (!file) return null
    try {
      const text = await file.text()
      const project = parseProjectFile(text)
      setSettings((s) => ({ ...s, sheetWidth: String(project.sheet.width), sheetHeight: String(project.sheet.height), margin: String(project.sheet.margin) }))
      const loadedRows: PieceRow[] = project.pieces.map((p) => ({
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
      }))
      setRows(loadedRows)
      return null
    } catch (err) {
      return err instanceof ProjectFileParseError ? err.message : "Proyecto inválido"
    }
  }, [])

  const handleNewProject = useCallback(() => {
    setRows([])
    setSettings(defaultProjectSettings())
    setMachine(defaultMachineSettings())
  }, [])

  return {
    rows,
    settings,
    machine,
    nomenclatura,
    sheetConfig,
    sheetGroups,
    sheets,
    conflictIds,
    canRun,
    isRunning,
    progress,
    error,
    nextColor,
    getSheetStats,

    onSettingsChange: handleSettingsChange,
    onMachineChange: handleMachineChange,

    onRemove: handleRemove,
    onClearAll: handleClearAll,
    onUpdateQuantity: handleUpdateQuantity,
    onAddCad: handleAddCad,
    onRotate: handleRotate,
    onMirrorX: handleMirrorX,
    onMirrorY: handleMirrorY,
    onDuplicate: handleDuplicate,

    onRun: handleRun,
    onCancel: cancel,
    onExportSheet: handleExportSheet,
    onExportMaterializedSheet: exportMaterializedSheet,
    onSaveProject: handleSaveProject,
    onOpenProjectFile: handleOpenProjectFile,
    onNewProject: handleNewProject,
  }
}

export type UseNestingProjectReturn = ReturnType<typeof useNestingProject>