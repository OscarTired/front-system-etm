"use client"

import dynamic from "next/dynamic"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Box, Layers, Info, Loader2, X } from "lucide-react"

import { MARK_COLOR } from "../cad/classify-dxf-color"
import type { PlacedPiece } from "../engine/types"
import { formatSheetRangeLabel } from "../utils/svg-render"
import { useNestingProject } from "../hooks/use-nesting-project"

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
import type { NestingPieceInput } from "./dxf-canvas"

const DxfCanvas = dynamic(
  () => import("@/features/nesting/components/dxf-canvas").then((m) => m.DxfCanvas),
  { ssr: false }
)

type PanelView = "sheet-pieces" | "project-material" | "inspector"

const PANEL_OPTIONS: EntityExpandedToggleOption<PanelView>[] = [
  { value: "sheet-pieces", label: "Plancha y Piezas", icon: Box },
  { value: "project-material", label: "Proyecto y Material", icon: Layers },
  { value: "inspector", label: "Inspector", icon: Info },
]

export function NestingPage() {
  const { isCompact } = useResponsive()
  const project = useNestingProject()

  const [previewRow, setPreviewRow] = useState<CadRow | null>(null)
  const [activeGroupIndex, setActiveGroupIndex] = useState<number>(0)
  const [selectedPieceIndex, setSelectedPieceIndex] = useState<number | null>(null)
  const [exportDialogOpen, setExportDialogOpen] = useState<boolean>(false)
  const [activePanel, setActivePanel] = useState<PanelView>("sheet-pieces")
  const [isMobilePanelOpen, setIsMobilePanelOpen] = useState<boolean>(false)
  const [marksHidden, setMarksHidden] = useState<boolean>(false)

  const projectInputRef = useRef<HTMLInputElement>(null)
  const pieceListRef = useRef<PieceListHandle>(null)

  useEffect(() => {
    if (!isCompact) {
      setIsMobilePanelOpen(false)
    }
  }, [isCompact])

  const activeGroup = project.sheetGroups[activeGroupIndex] ?? null
  
  const canvasPieces: PlacedPiece[] = useMemo(
    () => (activeGroup ? activeGroup.sheet.pieces : []),
    [activeGroup]
  )

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
  const selectedPiece = selectedPieceIndex !== null ? canvasPieces[selectedPieceIndex] ?? null : null

  const handleSelectPiece = useCallback((index: number | null) => {
    setSelectedPieceIndex(index)
    if (index !== null) setActivePanel("inspector")
  }, [])

  const handleRun = useCallback(() => {
    setActiveGroupIndex(0)
    setSelectedPieceIndex(null)
    project.onRun()
  }, [project])

  const handleOpenProjectFile = useCallback(async (file: File | undefined) => {
    if (!file) return
    const errorMessage = await project.onOpenProjectFile(file)
    if (errorMessage) console.error(errorMessage)
  }, [project])

  const handleNewProject = useCallback(() => {
    project.onNewProject()
    setSelectedPieceIndex(null)
    setPreviewRow(null)
  }, [project])

  const pieceListProps: PieceListProps = useMemo(
    () => ({
      rows: project.rows,
      conflictIds: project.conflictIds,
      disabled: project.isRunning,
      onAddCad: project.onAddCad,
      onRemove: project.onRemove,
      onUpdateQuantity: project.onUpdateQuantity,
      onPreviewRow: setPreviewRow,
      nextColor: project.nextColor,
    }),
    [project]
  )

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
            {/* Plancha fija (no participa del scroll) */}
            <div className="shrink-0 flex flex-col gap-2.5 rounded-2xl bg-white/3 p-3 border border-white/5">
              <h2 className="text-[11px] font-semibold uppercase tracking-widest text-neutral-400">Plancha</h2>
              <SheetDimensionsFields settings={project.settings} onChange={project.onSettingsChange} />
            </div>
            
            {/* Piezas con scroll interno exclusivo */}
            <div className="flex min-h-0 flex-1 flex-col rounded-2xl bg-white/3 p-3 border border-white/5 overflow-hidden">
              <PieceList ref={pieceListRef} {...pieceListProps} />
            </div>
          </div>
        ) : (
          <ScrollArea className="h-full w-full pr-1">
            <div className="flex flex-col gap-3 pb-4">
              {activePanel === "project-material" && (
                <div className="flex flex-col gap-2.5 rounded-2xl bg-white/3 p-3 border border-white/5">
                  <h2 className="text-[11px] font-semibold uppercase tracking-widest text-neutral-400">Proyecto y material</h2>
                  <MaterialPanel settings={project.settings} onChange={project.onSettingsChange} />
                </div>
              )}

              {activePanel === "inspector" && (
                <div className="rounded-2xl bg-white/3 p-3 border border-white/5">
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

      <div className="pt-3 border-t border-white/5 mt-auto shrink-0">
        {!project.isRunning ? (
          <Button size="default" className="w-full" disabled={!project.canRun} onClick={handleRun}>
            Nestear
          </Button>
        ) : (
          <div className="flex flex-col gap-2">
            <Button size="default" variant="outline" className="w-full" onClick={project.onCancel}>
              <X className="h-4 w-4" />
              Cancelar
            </Button>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{ width: `${Math.round(project.progress * 100)}%` }}
              />
            </div>
            <p className="flex items-center justify-center gap-1.5 text-xs text-neutral-500">
              <Loader2 className="h-3 w-3 animate-spin" />
              Calculando… {Math.round(project.progress * 100)}%
            </p>
          </div>
        )}

        {project.error && (
          <p className="rounded-lg bg-destructive/10 p-2 text-xs text-destructive mt-2">{project.error}</p>
        )}
      </div>
    </div>
  )

  return (
    <div className="mx-auto flex w-full max-w-400 flex-col h-full min-h-0 overflow-hidden">
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
        onToggleLayers={() => setMarksHidden((v) => !v)}
        layersHidden={marksHidden}
        onSettings={() => {}}
        onTogglePanel={isCompact ? () => setIsMobilePanelOpen(true) : undefined}
      />

      <div className="flex min-h-0 flex-1 gap-4 overflow-hidden p-4">
        {!isCompact && (
          <aside className="flex h-full w-80 shrink-0 flex-col overflow-hidden rounded-2xl bg-white/3 border border-white/5 shadow-sm p-3">
            {renderSidePanelContent()}
          </aside>
        )}

        <main className="flex min-h-0 flex-1 flex-col gap-2 overflow-hidden rounded-2xl bg-white/3 border border-white/5 shadow-sm p-3">
          {project.sheetGroups.length > 0 && (
            <div className="shrink-0">
              <SheetTabs
                items={sheetTabItems}
                activeIndex={activeGroupIndex}
                onChange={(i) => {
                  setActiveGroupIndex(i)
                  setSelectedPieceIndex(null)
                }}
              />
            </div>
          )}

          <div className="min-h-[400px] flex-1 overflow-hidden rounded-xl bg-neutral-900 tablet:min-h-0 border border-white/5">
            {canvasPieces.length > 0 ? (
              <DxfCanvas
                pieces={dxfCanvasPieces}
                sheetSize={{ width: project.sheetConfig.width, height: project.sheetConfig.height }}
                selectedPieceIndex={selectedPieceIndex}
                onSelectPiece={handleSelectPiece}
                hiddenColors={marksHidden ? [MARK_COLOR] : undefined}
              />
            ) : (
              <div className="flex h-full items-center justify-center px-8 text-center text-sm text-neutral-500">
                Importa una pieza o presiona Nestear para verla acá.
              </div>
            )}
          </div>
        </main>
      </div>

      <Sheet open={isCompact && isMobilePanelOpen} onOpenChange={setIsMobilePanelOpen}>
        <SheetContent className="flex flex-col gap-3 p-4 bg-neutral-950 border-white/10">
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
        onExportSheet={project.onExportSheet}
        onSaveProject={project.onSaveProject}
      />

      <PiecePreviewDialog row={previewRow} onClose={() => setPreviewRow(null)} />
    </div>
  )
}