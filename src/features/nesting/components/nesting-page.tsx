"use client"

import dynamic from "next/dynamic"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import {
  Loader2,
  AlignLeft,
  AlignRight,
  AlignCenterHorizontal,
  AlignStartVertical,
  AlignEndVertical,
  AlignCenterVertical,
  Trash2,
  SlidersHorizontal
} from "lucide-react"
import { toast } from "sonner"

import { piecesCollide } from "../engine/polygon-collision"
import type { NestedSheet } from "../engine/types"
import type { BridgeSettings } from "../export/dxf-export"
import { formatSheetRangeLabel } from "../utils/svg-render"
import { useNestingProject } from "../hooks/use-nesting-project"
import { useSheetHistory } from "../hooks/use-sheet-history"
import { useCanvasPieces } from "../hooks/use-canvas-pieces"
import { useNestingTransforms } from "../hooks/use-nesting-transforms"
import { useNestingClipboard } from "../hooks/use-nesting-clipboard"
import { useNestingRun } from "../hooks/use-nesting-run"

import { SheetTabs, type SheetTabItem } from "./sheet-tabs"
import { PropertiesPanel } from "./properties-panel"
import { ExportDialog } from "./export-dialog"
import { DiagnosticsDialog } from "./diagnostics-dialog"
import { ProjectDialog } from "./project-dialog"
import { PiecePreviewDialog } from "./piece-preview-dialog"
import { MaterialPanel } from "./material-panel"
import { PieceList, type PieceListHandle, type PieceListProps } from "./piece-list"
import { PieceListRow } from "./piece-list-row"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useResponsive } from "@/shared/responsive/hooks/use-responsive"
import { computeLayerList, type NestingPieceInput } from "./dxf-canvas/dxf-canvas"
import { LayerManager } from "./layer-manager"
import { NestingPanel, type NestingPanelView } from "./nesting-panel"
import { NestingConfirmDialog } from "./nesting-confirm-dialog"

const DxfCanvas = dynamic(
  () => import("@/features/nesting/components/dxf-canvas/dxf-canvas").then((m) => m.DxfCanvas),
  { ssr: false },
)

/** Solo mostrar toast de restauración una vez por carga real de JS (F5).
 *  Navegar a otra ruta y volver no debe volver a molestar. */
let sessionToastShownThisRuntime = false

export function NestingPage() {
  const { isCompact } = useResponsive()
  const project = useNestingProject()
  const history = useSheetHistory()

  const projectRef = useRef(project)
  useEffect(() => {
    projectRef.current = project
  })
  const historyRef = useRef(history)
  useEffect(() => {
    historyRef.current = history
  })
  const deleteSelectedRef = useRef<(() => void) | null>(null)
  const pendingSelectRef = useRef<number[] | null>(null)

  const [previewRowId, setPreviewRowId] = useState<string | null>(null)
  const [activeGroupIndex, setActiveGroupIndex] = useState(0)
  const [selectedPieceIndices, setSelectedPieceIndices] = useState<number[]>([])
  const [lockedPieceIndices, setLockedPieceIndices] = useState<number[]>([])
  const [exportDialogOpen, setExportDialogOpen] = useState(false)
  const [diagnosticsOpen, setDiagnosticsOpen] = useState(false)
  const [projectDialogOpen, setProjectDialogOpen] = useState(false)
  const [projectDialogMode, setProjectDialogMode] = useState<"save" | "open">("save")
  const [activePanel, setActivePanel] = useState<NestingPanelView>("sheet-pieces")
  const [isMobilePanelOpen, setIsMobilePanelOpen] = useState(false)
  const [hiddenLayerKeys, setHiddenLayerKeys] = useState<Set<string>>(new Set())

  // Estas dos props se pasan al DxfCanvas y de ahí alimentan el
  // useEffect que reconstruye entidades/colisiones/toolpath y reajusta
  // la cámara (fitToSheetOrEntities). Antes se creaban inline en cada
  // render (`{{ width, height }}` y `Array.from(...)`), o sea nunca eran
  // el mismo objeto/array aunque el contenido no cambiara — eso hacía
  // que ese efecto se re-ejecutara en CADA render de esta página, no
  // solo cuando de verdad cambiaban piezas/plancha/capas ocultas. Con
  // useMemo, la identidad solo cambia cuando el contenido real cambia.
  const sheetSize = useMemo(
    () => ({ width: project.sheetConfig.width, height: project.sheetConfig.height }),
    [project.sheetConfig.width, project.sheetConfig.height],
  )
  const hiddenKeysArray = useMemo(
    () => Array.from(hiddenLayerKeys),
    [hiddenLayerKeys],
  )
  const [transformMode, setTransformMode] = useState<"free" | "geometric">("free")
  const [rotationStep, setRotationStep] = useState<15 | 45 | 90 | 180>(90)
  const [pendingDelete, setPendingDelete] = useState(false)

  const positionOverrides = history.positionOverrides
  const angleOverrides = history.angleOverrides
  const projectInputRef = useRef<HTMLInputElement>(null)
  const pieceListRef = useRef<PieceListHandle>(null)

  const previewRow = useMemo(
    () => (previewRowId ? (project.rows.find((r) => r.id === previewRowId) ?? null) : null),
    [previewRowId, project.rows],
  )

  // Toast de restauración: solo en carga fría (F5 / primer mount del runtime).
  // Cambiar de página en el SPA no debe volver a mostrar el aviso.
  useEffect(() => {
    if (!project.sessionRestored || sessionToastShownThisRuntime) return
    sessionToastShownThisRuntime = true
    toast("Trabajo restaurado", {
      description: `Recuperado del navegador${
        project.sessionSavedAt ? ` · ${new Date(project.sessionSavedAt).toLocaleString()}` : ""
      }`,
      duration: 8_000,
      action: {
        label: "Descartar",
        onClick: () => {
          project.onDiscardSession()
          history.resetAll?.() ?? history.reset()
          setSelectedPieceIndices([])
          setActiveGroupIndex(0)
        },
      },
    })
  }, [project.sessionRestored, project.sessionSavedAt, project, history])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
      const mod = e.ctrlKey || e.metaKey
      const key = e.key.toLowerCase()
      if (mod) {
        if (key === "z" && !e.shiftKey) {
          e.preventDefault()
          history.undo()
        } else if ((key === "z" && e.shiftKey) || key === "y") {
          e.preventDefault()
          history.redo()
        }
        return
      }
      if (e.key === "Delete" || e.key === "Backspace") {
        e.preventDefault()
        deleteSelectedRef.current?.()
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [history])

  const editsHydratedRef = useRef(false)
  // Este efecto SÍ debe llamar setState directo en su cuerpo: es
  // hidratación única de estado local (posición/ángulo/piezas
  // bloqueadas) desde un sistema externo (sesión persistida), disparada
  // cuando ese sistema pasa a estar listo (project.sessionReady). Está
  // protegido con editsHydratedRef para que corra como máximo una vez
  // por sesión — no hay cascada de renders posible. El lint
  // react-hooks/set-state-in-effect marca cualquier setState en un
  // efecto sin distinguir este caso ("sincronizar con sistema externo",
  // que su propia guía marca como uso correcto) de un antipatrón real;
  // forzar esto a otro patrón para complacer al lint agregaría
  // complejidad sin ganar nada.
  useEffect(() => {
    if (!project.sessionReady || editsHydratedRef.current) return
    editsHydratedRef.current = true
    if (!project.sessionRestored) return
    const idx = project.getActiveGroupIndexForSession()
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (typeof idx === "number" && idx >= 0) setActiveGroupIndex(idx)
    const edits = project.getSheetEdits()
    const snap = edits[String(idx ?? 0)]
    if (snap) {
      history.replace({
        positionOverrides: snap.positionOverrides ?? {},
        angleOverrides: snap.angleOverrides ?? {},
      })
      setLockedPieceIndices(snap.lockedIndices ?? [])
    } else {
      history.resetAll?.() ?? history.reset()
      setLockedPieceIndices([])
    }
  }, [project.sessionReady, project.sessionRestored, history, project])

  useEffect(() => {
    const p = projectRef.current
    if (!p.sessionReady || !editsHydratedRef.current) return
    const key = String(activeGroupIndex)
    const prev = p.getSheetEdits()
    p.setSheetEdits({
      ...prev,
      [key]: { positionOverrides, angleOverrides, lockedIndices: lockedPieceIndices },
    })
    p.setActiveGroupIndexForSession(activeGroupIndex)
    p.requestSessionSave()
  }, [positionOverrides, angleOverrides, lockedPieceIndices, activeGroupIndex])

  // Antes había un useEffect que resetaba isMobilePanelOpen a false al
  // salir de isCompact. Era redundante: el <Sheet> más abajo ya se
  // renderiza con `open={isCompact && isMobilePanelOpen}`, así que en
  // desktop el panel queda cerrado visualmente sin importar el valor
  // interno de isMobilePanelOpen — no hace falta sincronizarlo con un
  // efecto (era exactamente el caso de "You Might Not Need an Effect").

  const activeGroup = project.sheetGroups[activeGroupIndex] ?? null

  const canvasPieces = useCanvasPieces(activeGroup, positionOverrides, angleOverrides)

  useEffect(() => {
    const h = historyRef.current
    const p = projectRef.current
    h.setActiveKey(activeGroupIndex)
    const snap = p.getSheetEdits()[String(activeGroupIndex)]
    const empty =
      Object.keys(h.positionOverrides).length === 0 && Object.keys(h.angleOverrides).length === 0
    if (
      empty &&
      snap &&
      (Object.keys(snap.positionOverrides).length > 0 || Object.keys(snap.angleOverrides).length > 0)
    ) {
      h.replace({
        positionOverrides: snap.positionOverrides ?? {},
        angleOverrides: snap.angleOverrides ?? {},
      })
    }
    if (pendingSelectRef.current) {
      setSelectedPieceIndices(pendingSelectRef.current)
      pendingSelectRef.current = null
    } else {
      setSelectedPieceIndices([])
    }
  }, [activeGroupIndex])

  const rawPieces = activeGroup?.sheet.pieces ?? []

  const transforms = useNestingTransforms({
    history,
    canvasPieces,
    rawPieces,
    lockedPieceIndices,
    sheetConfig: project.sheetConfig,
    transformMode,
  })

  const clipboard = useNestingClipboard({
    history,
    lockedPieceIndices,
    activeGroupIndex,
  })

  const { pendingRenest, setPendingRenest, handleRun, doRunNesting } = useNestingRun({
    history,
    isRunning: project.isRunning,
    rowsCount: project.rows.length,
    sheetGroupsCount: project.sheetGroups.length,
    onRun: project.onRun,
    setLockedPieceIndices,
    setActiveGroupIndex,
    setSelectedPieceIndices,
  })

  const dxfCanvasPieces: NestingPieceInput[] = useMemo(
    () =>
      canvasPieces.map((p) => ({
        outline: p.outline.points,
        subOutlines: (p.subEntities ?? []).map((s) => ({
          points: s.outline.points,
          color: s.color,
          layer: s.layer,
        })),
        color: p.color,
      })),
    [canvasPieces],
  )

  const layerList = useMemo(() => computeLayerList(dxfCanvasPieces), [dxfCanvasPieces])

  const collidingPieceIndices = useMemo(() => {
    const set = new Set<number>()
    for (let i = 0; i < canvasPieces.length; i++) {
      for (let j = i + 1; j < canvasPieces.length; j++) {
        if (piecesCollide(canvasPieces[i], canvasPieces[j])) {
          set.add(i)
          set.add(j)
        }
      }
    }
    return Array.from(set)
  }, [canvasPieces])

  const handleToggleLayer = useCallback((key: string) => {
    setHiddenLayerKeys((prev) => {
      const next = new Set(prev)
      const k = key.toUpperCase()
      if (next.has(k)) next.delete(k)
      else next.add(k)
      return next
    })
  }, [])

  const handleShowAllLayers = useCallback(() => setHiddenLayerKeys(new Set()), [])

  const sheetTabItems: SheetTabItem[] = useMemo(
    () =>
      project.sheetGroups.map((group, i) => ({
        key: String(i),
        // formatSheetRangeLabel ya incluye el rango "#2-5" cuando hay
        // varias planchas idénticas consecutivas: no repetir el conteo
        // acá también (antes decía "Planchas #2-5 · 3mm ×4", redundante).
        label: formatSheetRangeLabel(group),
        usagePercent: project.getSheetStats(i)?.usagePercent ?? 0,
        // Espesor real de la plancha, para que SheetTabs pueda agrupar
        // correctamente por espesor en vez de meter todo en "s/esp.".
        thicknessMm: group.sheet.thicknessMm,
      })),
    [project.sheetGroups, project.getSheetStats],
  )

  const sheetStats = project.getSheetStats(activeGroupIndex)
  const selectedPiece =
    selectedPieceIndices.length > 0
      ? canvasPieces[selectedPieceIndices[selectedPieceIndices.length - 1]]
      : null
  const selectedPieceName = useMemo(() => {
    if (!selectedPiece?.pieceId) return null
    return project.rows.find((r) => r.id === selectedPiece.pieceId)?.fileName ?? null
  }, [selectedPiece, project.rows])
  const selectedCadRow = useMemo(() => {
    if (!selectedPiece?.pieceId) return null
    return project.rows.find((r) => r.id === selectedPiece.pieceId) ?? null
  }, [selectedPiece, project.rows])
  const highlightedIds = useMemo(() => {
    const ids = new Set<string>()
    for (const i of selectedPieceIndices) {
      const id = canvasPieces[i]?.pieceId
      if (id) ids.add(id)
    }
    return ids
  }, [selectedPieceIndices, canvasPieces])

  const pieceMaterialsSummary = useMemo(() => {
    const thicknesses = new Set<number>()
    const materials = new Set<string>()
    for (const r of project.rows) {
      const th = r.material?.thickness
      if (typeof th === "number" && th > 0) thicknesses.add(th)
      const mat = r.material?.dinNorm || r.material?.alloy
      if (mat && mat !== "N/D") materials.add(mat)
    }
    return {
      thicknesses: Array.from(thicknesses).sort((a, b) => a - b),
      materials: Array.from(materials).sort((a, b) => a.localeCompare(b)),
    }
  }, [project.rows])

  const nameById = useMemo(() => {
    const m: Record<string, string> = {}
    for (const r of project.rows) m[r.id] = r.fileName
    return m
  }, [project.rows])

  const collisionPairs = useMemo(() => {
    const pairs: { a: number; b: number; nameA: string; nameB: string }[] = []
    for (let i = 0; i < canvasPieces.length; i++) {
      for (let j = i + 1; j < canvasPieces.length; j++) {
        if (!piecesCollide(canvasPieces[i], canvasPieces[j])) continue
        const idA = canvasPieces[i]?.pieceId
        const idB = canvasPieces[j]?.pieceId
        const nameA =
          (idA && project.rows.find((r) => r.id === idA)?.fileName) || `Pieza ${i + 1}`
        const nameB =
          (idB && project.rows.find((r) => r.id === idB)?.fileName) || `Pieza ${j + 1}`
        pairs.push({ a: i, b: j, nameA, nameB })
      }
    }
    return pairs
  }, [canvasPieces, project.rows])

  const handleSelectPiece = useCallback((index: number | null, additive: boolean) => {
    if (index === null) {
      setSelectedPieceIndices([])
      return
    }
    setSelectedPieceIndices((prev) => {
      if (!additive) return [index]
      return prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
    })
  }, [])

  const handleLocateRow = useCallback(
    (row: { id: string }) => {
      for (let gi = 0; gi < project.sheetGroups.length; gi++) {
        const group = project.sheetGroups[gi]
        const idx = group.sheet.pieces.findIndex((p) => p.pieceId === row.id)
        if (idx >= 0) {
          if (gi === activeGroupIndex) setSelectedPieceIndices([idx])
          else {
            pendingSelectRef.current = [idx]
            setActiveGroupIndex(gi)
          }
          setActivePanel("inspector")
          return
        }
      }
      setPreviewRowId(row.id)
    },
    [project.sheetGroups, activeGroupIndex],
  )

  const handleDeleteSelected = useCallback(() => {
    if (selectedPieceIndices.length === 0 || !activeGroup) return
    setPendingDelete(true)
  }, [selectedPieceIndices, activeGroup])
  deleteSelectedRef.current = handleDeleteSelected

  const confirmDeleteFromSheet = useCallback(() => {
    if (selectedPieceIndices.length === 0 || !activeGroup) return
    project.removePlacedPieces(activeGroup.startIndex, selectedPieceIndices)
    setSelectedPieceIndices([])
    setPendingDelete(false)
  }, [selectedPieceIndices, activeGroup, project])

  const confirmDeleteFromProject = useCallback(() => {
    if (selectedPieceIndices.length === 0 || !activeGroup) return
    const pieceIds = new Set(
      selectedPieceIndices
        .map((i) => canvasPieces[i]?.pieceId)
        .filter((id): id is string => Boolean(id)),
    )
    project.removePlacedPieces(activeGroup.startIndex, selectedPieceIndices)
    for (const id of pieceIds) project.onRemove(id)
    setSelectedPieceIndices([])
    setPendingDelete(false)
  }, [selectedPieceIndices, activeGroup, project, canvasPieces])

  const pieceListProps: PieceListProps = useMemo(
    () => ({
      rows: project.rows,
      conflictIds: project.conflictIds,
      onOpenDiagnostics: () => setDiagnosticsOpen(true),
      disabled: project.isRunning,
      onAddCad: project.onAddCad,
      onRemove: project.onRemove,
      onClearAll: project.onClearAll,
      onUpdateQuantity: project.onUpdateQuantity,
      onPreviewRow: (row) => setPreviewRowId(row.id),
      onLocateRow: handleLocateRow,
      onRotate: project.onRotate,
      onMirrorX: project.onMirrorX,
      onMirrorY: project.onMirrorY,
      onDuplicate: project.onDuplicate,
      nextColor: project.nextColor,
      highlightedIds,
    }),
    [project, highlightedIds, handleLocateRow],
  )

  const hasOverrides =
    Object.keys(positionOverrides).length > 0 || Object.keys(angleOverrides).length > 0

  const handleExportSheet = useCallback(
    (format: "dxf" | "nsp", sheetIndex: number, bridges?: BridgeSettings) => {
      if (hasOverrides && activeGroup && sheetIndex === activeGroup.startIndex) {
        const materialized: NestedSheet = { pieces: canvasPieces }
        project.onExportMaterializedSheet(format, materialized, sheetIndex, bridges)
        return
      }
      project.onExportSheet(format, sheetIndex, bridges)
    },
    [hasOverrides, activeGroup, canvasPieces, project],
  )

  const handleOpenProjectFile = useCallback(
    async (file: File | undefined) => {
      if (!file) return
      const errorMessage = await project.onOpenProjectFile(file)
      if (errorMessage) console.error(errorMessage)
    },
    [project],
  )

  const handleNewProject = useCallback(() => {
    project.onNewProject()
    setSelectedPieceIndices([])
    setPreviewRowId(null)
  }, [project])

  const selectedOverrideDx = selectedPieceIndices.length
    ? (positionOverrides[selectedPieceIndices[selectedPieceIndices.length - 1]]?.dx ?? 0)
    : 0
  const selectedOverrideDy = selectedPieceIndices.length
    ? (positionOverrides[selectedPieceIndices[selectedPieceIndices.length - 1]]?.dy ?? 0)
    : 0
  const selectedOverrideAngle = selectedPieceIndices.length
    ? (angleOverrides[selectedPieceIndices[selectedPieceIndices.length - 1]] ?? 0)
    : 0

  const nestFooter = (
    <div className="flex flex-col gap-2">
      {!project.isRunning ? (
        <Button size="default" className="w-full" disabled={!project.canRun} onClick={handleRun}>
          Nestear
        </Button>
      ) : (
        <Button
          size="default"
          variant="outline"
          className="relative w-full cursor-pointer overflow-hidden border-none bg-neutral-900 text-white hover:bg-neutral-900"
          onClick={project.onCancel}
          title="Cancelar"
        >
          <div
            className="pointer-events-none absolute bottom-0 left-0 top-0 bg-white opacity-20 transition-all duration-150"
            style={{ width: `${Math.round(project.progress * 100)}%` }}
          />
          <span className="relative z-10 flex items-center justify-center gap-2 tabular-nums">
            <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
            <span>
              Calculando...{" "}
              <span className="inline-block min-w-[3ch] text-right">
                {Math.round(project.progress * 100)}
              </span>
              %
            </span>
          </span>
        </Button>
      )}
      {project.error && (
        <p className="rounded-lg bg-destructive/10 p-2 text-xs text-destructive">{project.error}</p>
      )}
    </div>
  )

  const panel = (
    <NestingPanel
      activePanel={activePanel}
      onActivePanelChange={setActivePanel}
      footer={nestFooter}
      pieces={<PieceList ref={pieceListRef} {...pieceListProps} />}
      projectMaterial={
        <ScrollArea className="min-h-0 flex-1">
          <div className="flex flex-col gap-3 px-3 pb-3 pt-3">
            <MaterialPanel
              settings={project.settings}
              onChange={project.onSettingsChange}
              pieceMaterials={pieceMaterialsSummary}
              projectActions={{
                onNew: handleNewProject,
                onOpen: () => {
                  setProjectDialogMode("open")
                  setProjectDialogOpen(true)
                },
                onSave: () => {
                  setProjectDialogMode("save")
                  setProjectDialogOpen(true)
                },
                onExport: () => setExportDialogOpen(true),
              }}
            />
          </div>
        </ScrollArea>
      }
      layers={
        <ScrollArea className="min-h-0 flex-1">
          <div className="flex flex-col gap-3 px-3 pb-3 pt-3">
            <LayerManager
              layers={layerList}
              hiddenKeys={hiddenLayerKeys}
              onToggle={handleToggleLayer}
              onShowAll={handleShowAllLayers}
            />
          </div>
        </ScrollArea>
      }
      inspector={
        <ScrollArea className="min-h-0 flex-1">
          <div className="flex flex-col gap-3 px-3 pb-3 pt-3">
            <PropertiesPanel
              sheetStats={sheetStats}
              selectedPiece={selectedPiece}
              selectedPieceName={selectedPieceName}
              selectedPieceIndex={
                selectedPieceIndices.length
                  ? selectedPieceIndices[selectedPieceIndices.length - 1]
                  : null
              }
              espesor={project.settings.espesor}
              material={project.settings.material}
              overrideDx={selectedOverrideDx}
              overrideDy={selectedOverrideDy}
              overrideAngle={selectedOverrideAngle}
              onOverrideChange={(next) =>
                transforms.handleOverrideChange(selectedPieceIndices, next)
              }
              onResetOverrides={() => transforms.handleResetOverrides(selectedPieceIndices)}
              collisionPairs={collisionPairs}
              onSelectPieceIndex={(idx) => setSelectedPieceIndices([idx])}
              locked={
                selectedPieceIndices.length > 0 &&
                lockedPieceIndices.includes(
                  selectedPieceIndices[selectedPieceIndices.length - 1],
                )
              }
              onToggleLock={() => {
                if (selectedPieceIndices.length === 0) return
                const idx = selectedPieceIndices[selectedPieceIndices.length - 1]
                setLockedPieceIndices((prev) =>
                  prev.includes(idx) ? prev.filter((i) => i !== idx) : [...prev, idx],
                )
              }}
              onCopyOffsets={() =>
                clipboard.copy(selectedPieceIndices, positionOverrides, angleOverrides)
              }
              onPasteOffsets={() => clipboard.paste(selectedPieceIndices)}
              canPasteOffsets={clipboard.canPaste}
            >
              {selectedCadRow && (
                <div className="flex flex-col gap-1">
                  <div className="px-1 text-[10px] font-semibold uppercase tracking-wider text-neutral-500">
                    Editar en lista
                  </div>
                  <PieceListRow
                    row={selectedCadRow}
                    conflict={project.conflictIds.has(selectedCadRow.id)}
                    disabled={project.isRunning}
                    highlighted
                    onPreview={(row) => setPreviewRowId(row.id)}
                    onLocate={handleLocateRow}
                    onUpdateQuantity={project.onUpdateQuantity}
                    onDuplicate={project.onDuplicate}
                    onRemove={project.onRemove}
                  />
                </div>
              )}
            </PropertiesPanel>
          </div>
        </ScrollArea>
      }
    />
  )

  return (
    <div className="relative flex h-full min-h-0 w-full flex-col overflow-hidden">
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

      <div className="flex h-full min-h-0 flex-1 gap-2 overflow-hidden p-0 desktop:gap-4 desktop:p-4">
        {!isCompact && (
          <aside className="flex h-full w-80 shrink-0 flex-col overflow-hidden rounded-2xl bg-white/3 p-3 shadow-sm">
            {panel}
          </aside>
        )}

        <main className="grid h-full min-h-0 flex-1 grid-rows-[auto_minmax(0,1fr)] gap-1.5 overflow-hidden rounded-2xl bg-white/3 p-1.5 shadow-sm desktop:gap-2 desktop:p-3">
          <div className="flex w-full min-w-0 shrink-0 items-center gap-1.5">
            <div className="min-w-0 flex-1">
              {project.sheetGroups.length > 0 ? (
                <SheetTabs
                  items={sheetTabItems}
                  activeIndex={activeGroupIndex}
                  onChange={(i) => {
                    setActiveGroupIndex(i)
                    setSelectedPieceIndices([])
                  }}
                />
              ) : (
                <div className="h-9 rounded-xl bg-white/4 ring-1 ring-white/6" />
              )}
            </div>
            {isCompact && (
              <button
                type="button"
                aria-label="Abrir panel"
                className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-white/6 text-neutral-200 ring-1 ring-white/10 transition hover:bg-white/10"
                onClick={() => setIsMobilePanelOpen(true)}
              >
                <SlidersHorizontal size={16} strokeWidth={2.2} />
              </button>
            )}
          </div>

          <div className="relative min-h-0 overflow-hidden rounded-xl bg-black/20">
            {project.sessionReady && dxfCanvasPieces.length > 0 ? (
              <DxfCanvas
                pieces={dxfCanvasPieces}
                sheetSize={sheetSize}
                selectedPieceIndices={selectedPieceIndices}
                onSelectPiece={handleSelectPiece}
                hiddenKeys={hiddenKeysArray}
                collidingPieceIndices={collidingPieceIndices}
                onMovePieces={transforms.handleMovePieces}
                onRotateSelected={transforms.handleRotateSelected}
                onRotateAroundPivot={transforms.handleRotateAroundPivot}
                rotationStep={rotationStep}
                transformMode={transformMode}
                onTransformModeChange={setTransformMode}
                onDeleteSelected={() => handleDeleteSelected()}
              />
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-neutral-500">
                {!project.sessionReady
                  ? "Cargando workspace…"
                  : "Importa una pieza o presiona Nestear para verla acá."}
              </div>
            )}
          </div>

          {/* La barra de deseleccionar/eliminar/rotar que vivía acá se
              fusionó con el pill de estado del canvas (dxf-canvas.tsx) —
              antes eran 2 elementos redundantes mostrando lo mismo
              ("N piezas" arriba de "N sel." abajo), en dos estilos
              distintos. "Alinear" sí queda acá: es una acción de nivel
              de página (necesita 2+ piezas y no tiene equivalente en el
              canvas). */}
          {selectedPieceIndices.length >= 2 && (
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-0.5 rounded-xl bg-[#101012]/95 p-1.5 shadow-lg backdrop-blur-sm">
                <span className="px-2 text-[10px] font-medium uppercase tracking-wider text-neutral-500">
                  Alinear
                </span>
                {(
                  [
                    ["left", AlignLeft],
                    ["center-h", AlignCenterHorizontal],
                    ["right", AlignRight],
                    ["top", AlignStartVertical],
                    ["center-v", AlignCenterVertical],
                    ["bottom", AlignEndVertical],
                  ] as const
                ).map(([mode, Icon]) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => transforms.handleAlign(mode, selectedPieceIndices)}
                    className="rounded-lg p-2 text-neutral-300 hover:bg-white/10 hover:text-white"
                  >
                    <Icon className="h-4 w-4" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </main>
      </div>

      <Sheet open={isCompact && isMobilePanelOpen} onOpenChange={setIsMobilePanelOpen}>
        <SheetContent className="flex flex-col gap-3 border-none bg-neutral-950 p-4">
          <SheetHeader className="p-0">
            <SheetTitle>Panel de Control</SheetTitle>
          </SheetHeader>
          <div className="min-h-0 flex-1 overflow-hidden">{panel}</div>
        </SheetContent>
      </Sheet>

      <NestingConfirmDialog
        open={pendingRenest}
        onOpenChange={setPendingRenest}
        title="Nestear de nuevo"
        description="Se recalculará el acomodo desde cero y se perderán movimientos, rotaciones y bloqueos manuales."
        confirmLabel="Nestear de nuevo"
        onConfirm={doRunNesting}
      />

      <Dialog open={pendingDelete} onOpenChange={(open) => !open && setPendingDelete(false)}>
        <DialogContent className="max-w-[calc(100vw-2rem)] rounded-2xl border-white/10 bg-neutral-900 p-5 text-white shadow-2xl sm:max-w-md">
          <DialogHeader>
            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-red-500/10 text-red-400">
              <Trash2 size={20} />
            </div>
            <DialogTitle className="text-lg font-bold text-white">Eliminar piezas</DialogTitle>
            <DialogDescription className="pt-2 text-sm leading-relaxed text-neutral-400">
              {selectedPieceIndices.length === 1
                ? "Elige cómo eliminar la pieza seleccionada."
                : `Elige cómo eliminar las ${selectedPieceIndices.length} piezas seleccionadas.`}
            </DialogDescription>
          </DialogHeader>
          <div className="mt-5 flex flex-col gap-2">
            <Button variant="outline" className="border-white/15" onClick={confirmDeleteFromSheet}>
              Solo de esta plancha
            </Button>
            <Button className="bg-red-600 hover:bg-red-500" onClick={confirmDeleteFromProject}>
              De plancha y del proyecto
            </Button>
            <Button variant="ghost" onClick={() => setPendingDelete(false)}>
              Cancelar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <DiagnosticsDialog
        open={diagnosticsOpen}
        onClose={() => setDiagnosticsOpen(false)}
        rows={project.rows}
        audit={project.materialAudit ?? null}
        forgivenIds={project.forgivenIds ?? new Set()}
        onForgive={(id) => project.forgiveConflict(id)}
        onRemove={(id) => project.onRemove(id)}
      />

      <ProjectDialog
        open={projectDialogOpen}
        mode={projectDialogMode}
        onClose={() => setProjectDialogOpen(false)}
        suggestedName={
          project.settings.cliente ? `nesting-${project.settings.cliente}` : "proyecto-nesting"
        }
        onSaveToBackend={async (name, existingId) => {
          await project.onSaveProjectBackend(name, existingId)
        }}
        onSaveLocal={async (name) => {
          await project.onSaveProjectLocal(name)
        }}
        onOpenFromBackend={async (id) => {
          await project.onOpenProjectFromBackend(id)
          const idx = project.getActiveGroupIndexForSession()
          setActiveGroupIndex(idx)
          setSelectedPieceIndices([])
          const snap = project.getSheetEdits()[String(idx)]
          history.replace({
            positionOverrides: snap?.positionOverrides ?? {},
            angleOverrides: snap?.angleOverrides ?? {},
          })
          setLockedPieceIndices(snap?.lockedIndices ?? [])
        }}
        onOpenLocalFile={async (file) => {
          const err = await project.onOpenProjectFile(file)
          if (err) throw new Error(err)
          const idx = project.getActiveGroupIndexForSession()
          setActiveGroupIndex(idx)
          setSelectedPieceIndices([])
          const snap = project.getSheetEdits()[String(idx)]
          history.replace({
            positionOverrides: snap?.positionOverrides ?? {},
            angleOverrides: snap?.angleOverrides ?? {},
          })
          setLockedPieceIndices(snap?.lockedIndices ?? [])
        }}
      />

      <ExportDialog
        nameById={nameById}
        open={exportDialogOpen}
        onClose={() => setExportDialogOpen(false)}
        sheetGroups={project.sheetGroups}
        sheets={project.sheets}
        sheetConfig={project.sheetConfig}
        nomenclatura={project.nomenclatura}
        onExportSheet={handleExportSheet}
        onSaveProject={project.onSaveProject}
        cliente={project.settings.cliente}
        maquina={project.machine.maquina}
      />

      <PiecePreviewDialog
        row={previewRow}
        onClose={() => setPreviewRowId(null)}
        onRotate={(id, deg) => project.onRotate(id, deg)}
        onMirrorX={(id) => project.onMirrorX(id)}
        onMirrorY={(id) => project.onMirrorY(id)}
      />
    </div>
  )
}