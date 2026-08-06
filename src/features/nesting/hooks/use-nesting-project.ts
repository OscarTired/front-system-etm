import { useCallback, useEffect, useMemo, useRef, useState } from "react"

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
import {
  serializeProjectV2,
  parseProjectFile,
  isProjectFileV2,
  ProjectFileParseError,
  type ProjectPieceEntry,
  type ProjectFile,
  type ProjectFileV2,
} from "../export/project-file"
import { nestingProjectsApi } from "../api/nesting-projects.api"
import { defaultProjectSettings, defaultMachineSettings, type ProjectSettings, type MachineSettings } from "../types/project-settings"
import { downloadTextFile, saveTextFile } from "../utils/file-helpers"
import type { PieceRow, CadRow } from "../components/piece-list"
import type { SheetStats } from "../components/properties-panel"
import {
  loadNestingDraft,
  saveNestingDraft,
  clearNestingDraft,
  draftHasWork,
  type NestingDraftV1,
  type SheetEditSnapshot,
} from "../export/nesting-session"

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
  const [forgivenIds, setForgivenIds] = useState<Set<string>>(() => new Set())
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

  const { status, progress, sheets, error, run, cancel, restoreSheets, clearSheets } = useNesting()
  const isRunning = status === "running"
  const [sessionRestored, setSessionRestored] = useState(false)
  const [sessionSavedAt, setSessionSavedAt] = useState<string | null>(null)
  const [sessionReady, setSessionReady] = useState(false)
  const sheetEditsRef = useRef<Record<string, SheetEditSnapshot>>({})
  const activeGroupIndexRef = useRef(0)
  const skipNextSaveRef = useRef(false)
  const [editsTick, setEditsTick] = useState(0)
  const requestSessionSave = useCallback(() => setEditsTick((n) => n + 1), [])

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

  /** Planchas con al menos 1 pieza (sin fantasmas 0%). */
  const nonEmptySheets = useMemo(
    () => (sheets ? sheets.filter((s) => s.pieces.length > 0) : null),
    [sheets]
  )
  const sheetGroups = useMemo(
    () => (nonEmptySheets ? groupIdenticalSheets(nonEmptySheets) : []),
    [nonEmptySheets]
  )

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
      .map((r) => ({
        id: r.id,
        material: r.material,
        forgiven: forgivenIds.has(r.id),
      }))
    return auditable.length > 1 ? auditMaterials(auditable) : null
  }, [rows, forgivenIds])

  const conflictIds = useMemo(() => {
    if (!materialAudit) return new Set<string>()
    return new Set(
      materialAudit.results
        .filter((r) => r.hasConflict && !forgivenIds.has(r.id))
        .map((r) => r.id),
    )
  }, [materialAudit, forgivenIds])

  const forgiveConflict = useCallback((id: string) => {
    setForgivenIds((prev) => {
      const next = new Set(prev)
      next.add(id)
      return next
    })
  }, [])

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

  const handleClearAll = useCallback(() => {
    setRows([])
    setForgivenIds(new Set())
    clearSheets()
    sheetEditsRef.current = {}
    void clearNestingDraft()
    setSessionRestored(false)
    setSessionSavedAt(null)
  }, [clearSheets])

  const handleUpdateQuantity = useCallback((id: string, quantity: string) =>
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, quantity } : r))), [])
  const handleAddCad = useCallback((newRows: CadRow[]) => {
    setRows((prev) => [...prev, ...newRows])
    // Auto-rellenar espesor / material solo si hay un único valor claro
    // (si hay varios, el panel muestra "Varios" y no se fuerza uno).
    setSettings((s) => {
      let next = s
      if (!s.espesor?.trim()) {
        const thicks = new Set(
          newRows
            .map((r) => r.material?.thickness)
            .filter((t): t is number => typeof t === "number" && t > 0)
            .map((t) => Math.round(t * 100) / 100),
        )
        if (thicks.size === 1) {
          next = { ...next, espesor: `${[...thicks][0]}` }
        }
      }
      if (!s.material?.trim()) {
        const mats = new Set<string>()
        for (const r of newRows) {
          const din = r.material?.dinNorm
          const alloy = r.material?.alloy
          if (din && din !== "N/D") mats.add(din)
          else if (alloy && alloy !== "N/D") mats.add(alloy)
        }
        if (mats.size === 1) {
          next = { ...next, material: [...mats][0] }
        }
      }
      return next
    })
  }, [])

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

  /**
   * Quita piezas colocadas de una plancha del resultado de nest.
   * `sheetIndex` = índice real en el arreglo `sheets` (p.ej. group.startIndex).
   * Si la plancha queda vacía, se elimina del resultado.
   * Solo toca esa plancha (opción A): si formaba parte de un grupo ×N,
   * al cambiar deja de ser idéntica y el grupo se recalcula solo.
   */
  const removePlacedPieces = useCallback(
    (sheetIndex: number, pieceIndices: number[]) => {
      if (!sheets || pieceIndices.length === 0) return
      if (sheetIndex < 0 || sheetIndex >= sheets.length) return
      const removeSet = new Set(pieceIndices)
      const working = sheets.map((s, i) => {
        if (i !== sheetIndex) return s
        return {
          ...s,
          pieces: s.pieces.filter((_, pi) => !removeSet.has(pi)),
        }
      })
      const next = working.filter((s) => s.pieces.length > 0)
      restoreSheets(next.length > 0 ? next : null)
    },
    [sheets, restoreSheets]
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
      run(validPieces, {
        sheet: sheetConfig,
        mode: settings.empaquetadoPreciso ? "precise" : "fast",
        separation: Number(settings.separacion) || 0,
        rotationMode: settings.rotacionPermitida,
      })
    }, [validPieces, isRunning, run, sheetConfig, settings.separacion, settings.rotacionPermitida, settings.empaquetadoPreciso])

  const handleExportSheet = useCallback((format: "dxf" | "nsp", sheetIndex: number, bridges?: BridgeSettings) => {
    if (!sheets) return
    const sheet = sheets[sheetIndex]
    const fileName = buildSheetFileName(nomenclatura, sheet.pieces.length, sheetIndex)
    if (format === "dxf") {
      void saveTextFile(`${fileName}.dxf`, generateSheetDxf(sheet, sheetConfig, bridges ?? defaultBridgeSettings), "application/dxf", [".dxf"])
    } else {
      void saveTextFile(`${fileName}.nsp`, generateSheetNsp(sheet, sheetConfig), "application/xml", [".nsp"])
    }
  }, [sheets, nomenclatura, sheetConfig, defaultBridgeSettings])

  const exportMaterializedSheet = useCallback((format: "dxf" | "nsp", sheet: NestedSheet, sheetIndex: number, bridges?: BridgeSettings) => {
    const fileName = buildSheetFileName(nomenclatura, sheet.pieces.length, sheetIndex)
    if (format === "dxf") {
      void saveTextFile(`${fileName}.dxf`, generateSheetDxf(sheet, sheetConfig, bridges ?? defaultBridgeSettings), "application/dxf", [".dxf"])
    } else {
      void saveTextFile(`${fileName}.nsp`, generateSheetNsp(sheet, sheetConfig), "application/xml", [".nsp"])
    }
  }, [nomenclatura, sheetConfig, defaultBridgeSettings])

  const buildPiecesPayload = useCallback((): ProjectPieceEntry[] => {
    return rows.map((row) => ({
      id: row.id,
      source: "cad" as const,
      fileName: row.fileName,
      width: row.width,
      height: row.height,
      quantity: Number(row.quantity) || 1,
      color: row.color,
      outline: row.outline,
      subEntities: row.subEntities,
      material: row.material,
    }))
  }, [rows])

  const buildProjectV2 = useCallback(
    (name?: string): ProjectFileV2 => {
      const pieces = buildPiecesPayload()
      return {
        formatVersion: 2,
        name: name?.trim() || undefined,
        savedAt: new Date().toISOString(),
        sheet: sheetConfig,
        settings,
        machine,
        pieces,
        rows: pieces,
        sheets: sheets ?? null,
        activeGroupIndex: activeGroupIndexRef.current,
        editsBySheet: { ...sheetEditsRef.current },
      }
    },
    [buildPiecesPayload, sheetConfig, settings, machine, sheets],
  )

  const applyProjectFile = useCallback(
    (project: ProjectFile) => {
      if (isProjectFileV2(project)) {
        setSettings(project.settings)
        setMachine(project.machine)
        const pieceList = project.rows?.length ? project.rows : project.pieces
        const loadedRows: PieceRow[] = pieceList.map((p) => ({
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
        sheetEditsRef.current = project.editsBySheet ?? {}
        activeGroupIndexRef.current = project.activeGroupIndex ?? 0
        if (project.sheets && project.sheets.length > 0) {
          restoreSheets(project.sheets)
        } else {
          clearSheets()
        }
        return
      }
      setSettings((s) => ({
        ...s,
        sheetWidth: String(project.sheet.width),
        sheetHeight: String(project.sheet.height),
        margin: String(project.sheet.margin),
      }))
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
      sheetEditsRef.current = {}
      activeGroupIndexRef.current = 0
      clearSheets()
    },
    [restoreSheets, clearSheets],
  )

  const handleSaveProjectLocal = useCallback(
    async (name?: string) => {
      const payload = buildProjectV2(name)
      const base = (name?.trim() || "nesting-proyecto").replace(/[^\w.-]+/g, "_")
      const json = serializeProjectV2(payload)
      await saveTextFile(`${base}.json`, json, "application/json", [".json"])
    },
    [buildProjectV2],
  )

  const handleSaveProjectBackend = useCallback(
    async (name: string, existingId?: string) => {
      const payload = buildProjectV2(name)
      if (existingId) {
        await nestingProjectsApi.update(existingId, { name, project: payload })
      } else {
        await nestingProjectsApi.create({ name, project: payload })
      }
    },
    [buildProjectV2],
  )

  const handleSaveProject = useCallback(() => {
    void handleSaveProjectLocal()
  }, [handleSaveProjectLocal])

  const handleOpenProjectFile = useCallback(
    async (file: File | undefined) => {
      if (!file) return null
      try {
        const text = await file.text()
        const project = parseProjectFile(text)
        applyProjectFile(project)
        return null
      } catch (err) {
        return err instanceof ProjectFileParseError ? err.message : "Proyecto inválido"
      }
    },
    [applyProjectFile],
  )

  const handleOpenProjectFromBackend = useCallback(
    async (id: string) => {
      const project = await nestingProjectsApi.get(id)
      const normalized = parseProjectFile(JSON.stringify(project))
      applyProjectFile(normalized)
    },
    [applyProjectFile],
  )

  const handleNewProject = useCallback(() => {
    setRows([])
    setSettings(defaultProjectSettings())
    setMachine(defaultMachineSettings())
    clearSheets()
    sheetEditsRef.current = {}
    activeGroupIndexRef.current = 0
    void clearNestingDraft()
    setSessionRestored(false)
    setSessionSavedAt(null)
  }, [clearSheets])

  const setSheetEdits = useCallback((edits: Record<string, SheetEditSnapshot>) => {
    sheetEditsRef.current = edits
  }, [])

  const setActiveGroupIndexForSession = useCallback((index: number) => {
    activeGroupIndexRef.current = index
  }, [])

  // Estables (sin deps): leen el ref en el momento de la llamada, no capturan
  // ningún valor de closure. Antes eran arrow functions inline en el objeto
  // de retorno, lo que les daba una identidad nueva en cada render.
  const getSheetEdits = useCallback(() => sheetEditsRef.current, [])
  const getActiveGroupIndexForSession = useCallback(() => activeGroupIndexRef.current, [])

  const discardSession = useCallback(() => {
    void clearNestingDraft()
    setRows([])
    setSettings(defaultProjectSettings())
    setMachine(defaultMachineSettings())
    clearSheets()
    sheetEditsRef.current = {}
    activeGroupIndexRef.current = 0
    setSessionRestored(false)
    setSessionSavedAt(null)
  }, [clearSheets])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const draft = await loadNestingDraft()
      if (cancelled) return
      if (draftHasWork(draft) && draft) {
        skipNextSaveRef.current = true
        setSettings(draft.settings)
        setMachine(draft.machine)
        setRows(draft.rows)
        sheetEditsRef.current = draft.editsBySheet ?? {}
        activeGroupIndexRef.current = draft.activeGroupIndex ?? 0
        if (draft.sheets && draft.sheets.length > 0) {
          restoreSheets(draft.sheets)
        }
        setSessionRestored(true)
        setSessionSavedAt(draft.savedAt)
      }
      setSessionReady(true)
    })()
    return () => {
      cancelled = true
    }
  }, [restoreSheets])

  useEffect(() => {
    if (!sessionReady) return
    if (isRunning) return
    if (skipNextSaveRef.current) {
      skipNextSaveRef.current = false
      return
    }
    if (rows.length === 0 && !sheets?.length) return
    const timer = window.setTimeout(() => {
      const draft: NestingDraftV1 = {
        formatVersion: 1,
        savedAt: new Date().toISOString(),
        settings,
        machine,
        rows,
        sheets,
        activeGroupIndex: activeGroupIndexRef.current,
        editsBySheet: sheetEditsRef.current,
      }
      void saveNestingDraft(draft).then((where) => {
        if (where !== "failed") setSessionSavedAt(draft.savedAt)
      })
    }, 800)
    return () => window.clearTimeout(timer)
  }, [rows, settings, machine, sheets, sessionReady, isRunning, editsTick])

  useEffect(() => {
    const flush = () => {
      if (rows.length === 0 && !sheets?.length) return
      const draft: NestingDraftV1 = {
        formatVersion: 1,
        savedAt: new Date().toISOString(),
        settings,
        machine,
        rows,
        sheets,
        activeGroupIndex: activeGroupIndexRef.current,
        editsBySheet: sheetEditsRef.current,
      }
      try {
        localStorage.setItem("etm:nesting:draft:v1", JSON.stringify(draft))
      } catch {
        /* ignore */
      }
      void saveNestingDraft(draft)
    }
    const onVis = () => {
      if (document.visibilityState === "hidden") flush()
    }
    window.addEventListener("beforeunload", flush)
    document.addEventListener("visibilitychange", onVis)
    return () => {
      window.removeEventListener("beforeunload", flush)
      document.removeEventListener("visibilitychange", onVis)
    }
  }, [rows, settings, machine, sheets])

  // El objeto de retorno se memoiza para que su identidad solo cambie cuando
  // cambia alguno de sus valores/funciones reales. Sin esto, cualquier
  // componente que use `project` como dependencia de un useEffect (o de un
  // useMemo/useCallback) se re-ejecuta en cada render de este hook, lo que
  // puede encadenar renders infinitos si ese efecto a su vez actualiza estado.
  return useMemo(
    () => ({
      rows,
      settings,
      machine,
      nomenclatura,
      sheetConfig,
      sheetGroups,
      sheets,
      conflictIds,
      materialAudit,
      forgivenIds,
      forgiveConflict,
      canRun,
      isRunning,
      progress,
      error,
      nextColor,
      getSheetStats,

      sessionRestored,
      sessionSavedAt,
      sessionReady,
      onDiscardSession: discardSession,
      setSheetEdits,
      setActiveGroupIndexForSession,
      requestSessionSave,
      getSheetEdits,
      getActiveGroupIndexForSession,

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

      removePlacedPieces,

      onRun: handleRun,
      onCancel: cancel,
      onExportSheet: handleExportSheet,
      onExportMaterializedSheet: exportMaterializedSheet,
      onSaveProject: handleSaveProject,
      onSaveProjectLocal: handleSaveProjectLocal,
      onSaveProjectBackend: handleSaveProjectBackend,
      onOpenProjectFile: handleOpenProjectFile,
      onOpenProjectFromBackend: handleOpenProjectFromBackend,
      onNewProject: handleNewProject,
      buildProjectV2,
    }),
    [
      rows,
      settings,
      machine,
      nomenclatura,
      sheetConfig,
      sheetGroups,
      sheets,
      conflictIds,
      materialAudit,
      forgivenIds,
      forgiveConflict,
      canRun,
      isRunning,
      progress,
      error,
      nextColor,
      getSheetStats,
      sessionRestored,
      sessionSavedAt,
      sessionReady,
      discardSession,
      setSheetEdits,
      setActiveGroupIndexForSession,
      requestSessionSave,
      getSheetEdits,
      getActiveGroupIndexForSession,
      handleSettingsChange,
      handleMachineChange,
      handleRemove,
      handleClearAll,
      handleUpdateQuantity,
      handleAddCad,
      handleRotate,
      handleMirrorX,
      handleMirrorY,
      handleDuplicate,
      removePlacedPieces,
      handleRun,
      cancel,
      handleExportSheet,
      exportMaterializedSheet,
      handleSaveProject,
      handleSaveProjectLocal,
      handleSaveProjectBackend,
      handleOpenProjectFile,
      handleOpenProjectFromBackend,
      handleNewProject,
      buildProjectV2,
    ]
  )
}

export type UseNestingProjectReturn = ReturnType<typeof useNestingProject>