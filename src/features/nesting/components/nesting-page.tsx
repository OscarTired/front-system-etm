"use client"

import dynamic from "next/dynamic"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Layers, Info, Loader2, AlignLeft, AlignRight, AlignCenterHorizontal, AlignStartVertical, AlignEndVertical, AlignCenterVertical, LayoutGrid, SlidersHorizontal } from "lucide-react"

import { boundingRect, rotateOutlineAroundPoint } from "../engine/geometry"
import { piecesCollide } from "../engine/polygon-collision"
import type { PlacedPiece, NestedSheet } from "../engine/types"
import type { BridgeSettings } from "../export/dxf-export"
import { formatSheetRangeLabel } from "../utils/svg-render"
import { useNestingProject } from "../hooks/use-nesting-project"
import { constrainToMode } from "../utils/transform-mode"

import { Toolbar } from "./toolbar"
import { SheetTabs, type SheetTabItem } from "./sheet-tabs"
import { PropertiesPanel } from "./properties-panel"
import { ExportDialog } from "./export-dialog"
import { PiecePreviewDialog } from "./piece-preview-dialog"
import { SheetDimensionsFields, MaterialPanel } from "./material-panel"
import { PieceList, type CadRow, type PieceListHandle, type PieceListProps } from "./piece-list"
import { EntityExpandedToggle, type EntityExpandedToggleOption } from "@/shared/ui/entity-expanded-row/entity-expanded-toggle"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { useResponsive } from "@/shared/responsive/hooks/use-responsive"
import { computeLayerList, type NestingPieceInput } from "./dxf-canvas/dxf-canvas"
import { LayerManager } from "./layer-manager"

const DxfCanvas = dynamic(
  () => import("@/features/nesting/components/dxf-canvas/dxf-canvas").then((m) => m.DxfCanvas),
  { ssr: false }
)

type PanelView = "sheet-pieces" | "project-material" | "layers" | "inspector"

const PANEL_OPTIONS: EntityExpandedToggleOption<PanelView>[] = [
  { value: "sheet-pieces", label: "Plancha y Piezas", icon: LayoutGrid },
  { value: "project-material", label: "Proyecto y Material", icon: SlidersHorizontal },
  { value: "layers", label: "Capas", icon: Layers },
  { value: "inspector", label: "Inspector", icon: Info },
]

export function NestingPage() {
  const { isCompact } = useResponsive()
  const project = useNestingProject()

  const [previewRowId, setPreviewRowId] = useState<string | null>(null)
  const [activeGroupIndex, setActiveGroupIndex] = useState<number>(0)
  const [selectedPieceIndices, setSelectedPieceIndices] = useState<number[]>([])
  const [exportDialogOpen, setExportDialogOpen] = useState<boolean>(false)
  const [activePanel, setActivePanel] = useState<PanelView>("sheet-pieces")
  const [isMobilePanelOpen, setIsMobilePanelOpen] = useState<boolean>(false)
  const [hiddenLayerKeys, setHiddenLayerKeys] = useState<Set<string>>(new Set())
  const [positionOverrides, setPositionOverrides] = useState<Record<number, { dx: number; dy: number }>>({})
  const [angleOverrides, setAngleOverrides] = useState<Record<number, number>>({})
  const [transformMode, setTransformMode] = useState<"free" | "geometric">("free")
  const [rotationStep, setRotationStep] = useState<15 | 45 | 90 | 180>(90)

  const projectInputRef = useRef<HTMLInputElement>(null)
  const pieceListRef = useRef<PieceListHandle>(null)

  const previewRow = useMemo(
    () => (previewRowId ? project.rows.find((r) => r.id === previewRowId) ?? null : null),
    [previewRowId, project.rows]
  )

  useEffect(() => {
    if (!isCompact) {
      setIsMobilePanelOpen(false)
    }
  }, [isCompact])

  const activeGroup = project.sheetGroups[activeGroupIndex] ?? null

  const canvasPieces: PlacedPiece[] = useMemo(() => {
    const raw = activeGroup ? activeGroup.sheet.pieces : []
    return raw.map((p, i) => {
      const ang = angleOverrides[i] ?? 0
      const override = positionOverrides[i]
      let piece = p
      if (ang) {
        const b = boundingRect(p.outline)
        const pivot = { x: b.x + b.width / 2, y: b.y + b.height / 2 }
        piece = {
          ...p,
          angle: ((p.angle + ang) % 360 + 360) % 360,
          outline: rotateOutlineAroundPoint(p.outline, ang, pivot),
          subEntities: p.subEntities?.map((s) => ({
            ...s,
            outline: rotateOutlineAroundPoint(s.outline, ang, pivot),
          })),
        }
      }
      if (!override) return piece
      const { dx, dy } = override
      return {
        ...piece,
        x: piece.x + dx,
        y: piece.y + dy,
        outline: { points: piece.outline.points.map((pt) => ({ x: pt.x + dx, y: pt.y + dy })) },
        subEntities: piece.subEntities?.map((s) => ({
          ...s,
          outline: { points: s.outline.points.map((pt) => ({ x: pt.x + dx, y: pt.y + dy })) },
        })),
      }
    })
  }, [activeGroup, positionOverrides, angleOverrides])

  useEffect(() => {
    setPositionOverrides({})
    setAngleOverrides({})
    setSelectedPieceIndices([])
  }, [activeGroupIndex, project.sheetGroups.length])

  const dxfCanvasPieces: NestingPieceInput[] = useMemo(
    () =>
      canvasPieces.map((p) => ({
        subOutlines: p.subEntities?.length
          ? p.subEntities.map((s) => ({ points: s.outline.points, color: s.color, layer: s.layer }))
          : [],
        outline: p.outline.points,
        angle: p.angle,
      })),
    [canvasPieces]
  )

  const layerList = useMemo(() => computeLayerList(dxfCanvasPieces), [dxfCanvasPieces])

  const collidingPieceIndices = useMemo(() => {
    const colliding = new Set<number>()
    for (let i = 0; i < canvasPieces.length; i++) {
      for (let j = i + 1; j < canvasPieces.length; j++) {
        // Respetar calados: pieza dentro de hueco de otra ? colisión
        if (piecesCollide(canvasPieces[i], canvasPieces[j])) {
          colliding.add(i)
          colliding.add(j)
        }
      }
    }
    return Array.from(colliding)
  }, [canvasPieces])

  const handleToggleLayer = useCallback((key: string) => {
    setHiddenLayerKeys((prev) => {
      const next = new Set(prev)
      const upper = key.toUpperCase()
      if (next.has(upper)) next.delete(upper)
      else next.add(upper)
      return next
    })
  }, [])

  const handleShowAllLayers = useCallback(() => setHiddenLayerKeys(new Set()), [])

  const sheetTabItems: SheetTabItem[] = useMemo(
    () =>
      project.sheetGroups.map((group, i) => ({
        key: String(group.startIndex),
        label: `${formatSheetRangeLabel(group)}${group.count > 1 ? ` ×${group.count}` : ""}`,
        usagePercent: project.getSheetStats(i)?.usagePercent ?? 0,
      })),
    [project.sheetGroups, project.getSheetStats]
  )

  const sheetStats = project.getSheetStats(activeGroupIndex)
  const selectedPiece = selectedPieceIndices.length > 0
    ? canvasPieces[selectedPieceIndices[selectedPieceIndices.length - 1]] ?? null
    : null

  const handleSelectPiece = useCallback((index: number | null, additive: boolean) => {
    if (index === null) {
      setSelectedPieceIndices([])
      return
    }
    setSelectedPieceIndices((prev) => {
      if (!additive) return [index]
      return prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
    })
    setActivePanel("inspector")
  }, [])

  const handleMovePieces = useCallback((pieceIndices: number[], dx: number, dy: number) => {
    if (Math.abs(dx) < 1e-9 && Math.abs(dy) < 1e-9) return

    // Aplicamos constrainToMode antes de registrar el desplazamiento
    let wantDx = dx
    let wantDy = dy
    ;({ dx: wantDx, dy: wantDy } = constrainToMode(transformMode ?? "free", wantDx, wantDy))

    setPositionOverrides((prev) => {
      const next = { ...prev }
      for (const idx of pieceIndices) {
        const cur = next[idx] ?? { dx: 0, dy: 0 }
        next[idx] = { dx: cur.dx + wantDx, dy: cur.dy + wantDy }
      }
      return next
    })
  }, [transformMode])

  const handleRotateSelected = useCallback((pieceIndices: number[], degrees: number) => {
    if (pieceIndices.length === 0 || Math.abs(degrees) < 1e-9) return
    setAngleOverrides((prev) => {
      const next = { ...prev }
      for (const idx of pieceIndices) {
        const cur = next[idx] ?? 0
        next[idx] = ((cur + degrees) % 360 + 360) % 360
      }
      return next
    })
  }, [])

  const handleAlign = useCallback((mode: "left" | "right" | "top" | "bottom" | "center-h" | "center-v") => {
    if (selectedPieceIndices.length < 2) return
    const refIndex = selectedPieceIndices[selectedPieceIndices.length - 1]
    const refPiece = canvasPieces[refIndex]
    if (!refPiece) return
    const refBounds = boundingRect(refPiece.outline)

    setPositionOverrides((prev) => {
      const next = { ...prev }
      for (const idx of selectedPieceIndices) {
        if (idx === refIndex) continue
        const piece = canvasPieces[idx]
        if (!piece) continue
        const b = boundingRect(piece.outline)
        const current = prev[idx] ?? { dx: 0, dy: 0 }
        let dx = current.dx
        let dy = current.dy
        if (mode === "left") dx = current.dx + (refBounds.x - b.x)
        else if (mode === "right") dx = current.dx + (refBounds.x + refBounds.width - (b.x + b.width))
        else if (mode === "center-h") dx = current.dx + (refBounds.x + refBounds.width / 2 - (b.x + b.width / 2))
        else if (mode === "top") dy = current.dy + (refBounds.y - b.y)
        else if (mode === "bottom") dy = current.dy + (refBounds.y + refBounds.height - (b.y + b.height))
        else if (mode === "center-v") dy = current.dy + (refBounds.y + refBounds.height / 2 - (b.y + b.height / 2))
        next[idx] = { dx, dy }
      }
      return next
    })
  }, [selectedPieceIndices, canvasPieces])

  const handleRun = useCallback(() => {
    setActiveGroupIndex(0)
    setSelectedPieceIndices([])
    project.onRun()
  }, [project])

  const handleOpenProjectFile = useCallback(async (file: File | undefined) => {
    if (!file) return
    const errorMessage = await project.onOpenProjectFile(file)
    if (errorMessage) console.error(errorMessage)
  }, [project])

  const handleNewProject = useCallback(() => {
    project.onNewProject()
    setSelectedPieceIndices([])
    setPreviewRowId(null)
  }, [project])

  const pieceListProps: PieceListProps = useMemo(
    () => ({
      rows: project.rows,
      conflictIds: project.conflictIds,
      disabled: project.isRunning,
      onAddCad: project.onAddCad,
      onRemove: project.onRemove,
      onClearAll: project.onClearAll,
      onUpdateQuantity: project.onUpdateQuantity,
      onPreviewRow: (row) => setPreviewRowId(row.id),
      onRotate: project.onRotate,
      onMirrorX: project.onMirrorX,
      onMirrorY: project.onMirrorY,
      onDuplicate: project.onDuplicate,
      nextColor: project.nextColor,
    }),
    [project]
  )

  const hasOverrides = Object.keys(positionOverrides).length > 0 || Object.keys(angleOverrides).length > 0

  const handleExportSheet = useCallback((format: "dxf" | "nsp", sheetIndex: number, bridges?: BridgeSettings) => {
    if (hasOverrides && activeGroup && sheetIndex === activeGroup.startIndex) {
      const materialized: NestedSheet = { pieces: canvasPieces }
      project.onExportMaterializedSheet(format, materialized, sheetIndex, bridges)
      return
    }
    project.onExportSheet(format, sheetIndex, bridges)
  }, [hasOverrides, activeGroup, canvasPieces, project])

  const renderSidePanelContent = () => (
    <div className="flex h-full flex-col gap-3 overflow-hidden">
      <EntityExpandedToggle
        value={activePanel}
        onChange={setActivePanel}
        options={PANEL_OPTIONS}
      />

      <div className="min-h-0 flex-1 flex flex-col overflow-hidden">
        {activePanel === "sheet-pieces" ? (
          <div className="flex h-full flex-col gap-3 overflow-hidden">
            <div className="shrink-0 flex flex-col gap-2.5 rounded-2xl bg-white/3 p-3">
              <h2 className="text-[11px] font-semibold uppercase tracking-widest text-neutral-400">Plancha</h2>
              <SheetDimensionsFields settings={project.settings} onChange={project.onSettingsChange} />
            </div>
            
            <div className="flex min-h-0 flex-1 flex-col rounded-2xl bg-white/3 p-3 overflow-hidden">
              <PieceList ref={pieceListRef} {...pieceListProps} />
            </div>
          </div>
        ) : (
          <ScrollArea className="h-full w-full">
            <div className="flex flex-col gap-3 pb-4">
              {activePanel === "project-material" && (
                <div className="flex flex-col gap-2.5 rounded-2xl bg-white/3 p-3">
                  <h2 className="text-[11px] font-semibold uppercase tracking-widest text-neutral-400">Proyecto y material</h2>
                  <MaterialPanel settings={project.settings} onChange={project.onSettingsChange} />
                </div>
              )}

              {activePanel === "layers" && (
                <div className="rounded-2xl bg-white/3 p-3">
                  <LayerManager
                    layers={layerList}
                    hiddenKeys={hiddenLayerKeys}
                    onToggle={handleToggleLayer}
                    onShowAll={handleShowAllLayers}
                  />
                </div>
              )}

              {activePanel === "inspector" && (
                <div className="rounded-2xl bg-white/3 p-3">
                  <PropertiesPanel
                    sheetStats={sheetStats}
                    selectedPiece={selectedPiece}
                    espesor={project.settings.espesor}
                    material={project.settings.material}
                  />
                </div>
              )}
            </div>
            <ScrollBar className="w-1.5 bg-transparent hover:bg-white/5" />
          </ScrollArea>
        )}
      </div>

      <div className="pt-3 mt-auto shrink-0">
        {!project.isRunning ? (
          <Button size="default" className="w-full" disabled={!project.canRun} onClick={handleRun}>
            Nestear
          </Button>
        ) : (
          <Button
            size="default"
            variant="outline"
            className="w-full relative overflow-hidden bg-neutral-900 border-none text-white hover:bg-neutral-900 cursor-pointer"
            onClick={project.onCancel}
            title="Haz clic para cancelar"
          >
            <div
              className="absolute left-0 top-0 bottom-0 bg-white transition-all duration-150 pointer-events-none opacity-20"
              style={{ width: `${Math.round(project.progress * 100)}%` }}
            />
            <span className="relative z-10 flex items-center justify-center gap-2 tabular-nums">
              <Loader2 className="h-4 w-4 animate-spin shrink-0" />
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
          <p className="rounded-lg bg-destructive/10 p-2 text-xs text-destructive mt-2">{project.error}</p>
        )}
      </div>
    </div>
  )

  return (
    <div className="mx-auto flex w-full max-w-400 flex-col h-full min-h-0 overflow-hidden relative">
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
        onSave={project.onSaveProject}
        onImport={() => pieceListRef.current?.triggerImport()}
        onExport={() => setExportDialogOpen(true)}
        onToggleLayers={() => {
          setActivePanel("layers")
          if (isCompact) setIsMobilePanelOpen(true)
        }}
        layersHidden={hiddenLayerKeys.size > 0}
        onSettings={() => {}}
        onTogglePanel={isCompact ? () => setIsMobilePanelOpen(true) : undefined}
      />

      <div className="flex min-h-0 flex-1 gap-4 overflow-hidden p-4">
        {!isCompact && (
          <aside className="flex h-full w-80 shrink-0 flex-col overflow-hidden rounded-2xl bg-white/3 shadow-sm p-3">
            {renderSidePanelContent()}
          </aside>
        )}

        <main className="flex min-h-0 flex-1 flex-col gap-2 overflow-hidden rounded-2xl bg-white/3 shadow-sm p-3">
          {project.sheetGroups.length > 0 && (
            <div className="shrink-0 w-full min-w-0">
              <SheetTabs
                items={sheetTabItems}
                activeIndex={activeGroupIndex}
                onChange={(i) => {
                  setActiveGroupIndex(i)
                  setSelectedPieceIndices([])
                }}
              />
            </div>
          )}

          <div className="min-h-100 flex-1 overflow-hidden rounded-xl bg-neutral-900 tablet:min-h-0 relative">
            {canvasPieces.length > 0 ? (
              <DxfCanvas
                pieces={dxfCanvasPieces}
                sheetSize={{ width: project.sheetConfig.width, height: project.sheetConfig.height }}
                selectedPieceIndices={selectedPieceIndices}
                onSelectPiece={handleSelectPiece}
                hiddenKeys={hiddenLayerKeys.size > 0 ? Array.from(hiddenLayerKeys) : undefined}
                collidingPieceIndices={collidingPieceIndices}
                onMovePieces={handleMovePieces}
                onRotateSelected={handleRotateSelected}
                transformMode={transformMode}
                onTransformModeChange={setTransformMode}
                rotationStep={rotationStep}
                onRotationStepChange={setRotationStep}
              />
            ) : (
              <div className="flex h-full items-center justify-center px-8 text-center text-sm text-neutral-500">
                Importa una pieza o presiona Nestear para verla acá.
              </div>
            )}

            {canvasPieces.length > 0 && (
              <div className="absolute bottom-4 left-1/2 z-20 flex -translate-x-1/2 flex-col items-center gap-1.5">
                <div className="flex items-center gap-0.5 rounded-xl bg-[#101012]/95 p-1.5 shadow-lg backdrop-blur-sm">
                  <span className="px-2 text-[10px] font-medium uppercase tracking-wider text-neutral-500">
                    Modo
                  </span>
                  <div className="h-4 w-px bg-white/10" />
                  {(
                    [
                      ["free", "Libre"],
                      ["geometric", "Geométrico"],
                    ] as const
                  ).map(([mode, label]) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setTransformMode(mode)}
                      className={`rounded-lg px-2.5 py-1 text-[11px] font-medium transition-colors ${
                        transformMode === mode
                          ? "bg-white/15 text-white"
                          : "text-neutral-400 hover:bg-white/10 hover:text-white"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                  {transformMode === "geometric" && (
                    <>
                      <div className="h-4 w-px bg-white/10" />
                      {([15, 45, 90, 180] as const).map((step) => (
                        <button
                          key={step}
                          type="button"
                          onClick={() => setRotationStep(step)}
                          className={`rounded-lg px-2 py-1 text-[11px] font-medium tabular-nums transition-colors ${
                            rotationStep === step
                              ? "bg-cyan-500/25 text-cyan-200"
                              : "text-neutral-400 hover:bg-white/10 hover:text-white"
                          }`}
                        >
                          {step}°
                        </button>
                      ))}
                      <div className="h-4 w-px bg-white/10" />
                      <button
                        type="button"
                        disabled={selectedPieceIndices.length === 0}
                        onClick={() => handleRotateSelected(selectedPieceIndices, rotationStep)}
                        className="rounded-lg px-2.5 py-1 text-[11px] font-medium text-neutral-300 hover:bg-white/10 hover:text-white disabled:opacity-30"
                      >
                        Rotar +{rotationStep}°
                      </button>
                    </>
                  )}
                </div>
                {selectedPieceIndices.length >= 2 && (
                  <div className="flex items-center gap-0.5 rounded-xl bg-[#101012]/95 p-1.5 shadow-lg backdrop-blur-sm">
                    <span className="px-2 text-[10px] font-medium uppercase tracking-wider text-neutral-500">
                      Alinear ({selectedPieceIndices.length})
                    </span>
                    <div className="h-4 w-px bg-white/10" />
                    {(
                      [
                        ["left", AlignLeft, "Alinear izquierda"],
                        ["center-h", AlignCenterHorizontal, "Centrar horizontal"],
                        ["right", AlignRight, "Alinear derecha"],
                        ["top", AlignStartVertical, "Alinear arriba"],
                        ["center-v", AlignCenterVertical, "Centrar vertical"],
                        ["bottom", AlignEndVertical, "Alinear abajo"],
                      ] as const
                    ).map(([mode, Icon, label]) => (
                      <button
                        key={mode}
                        type="button"
                        onClick={() => handleAlign(mode)}
                        className="rounded-lg p-2 text-neutral-300 hover:bg-white/10 hover:text-white"
                        title={label}
                      >
                        <Icon className="h-4 w-4" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </main>
      </div>

      <Sheet open={isCompact && isMobilePanelOpen} onOpenChange={setIsMobilePanelOpen}>
        <SheetContent className="flex flex-col gap-3 p-4 bg-neutral-950 border-none">
          <SheetHeader className="p-0">
            <SheetTitle>Panel de Control</SheetTitle>
          </SheetHeader>
          <div className="min-h-0 flex-1 overflow-hidden">
            {renderSidePanelContent()}
          </div>
        </SheetContent>
      </Sheet>

      <ExportDialog
        open={exportDialogOpen}
        onClose={() => setExportDialogOpen(false)}
        sheetGroups={project.sheetGroups}
        sheets={project.sheets}
        sheetConfig={project.sheetConfig}
        nomenclatura={project.nomenclatura}
        onExportSheet={handleExportSheet}
        onSaveProject={project.onSaveProject}
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