"use client"

import dynamic from "next/dynamic"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Settings2, Info } from "lucide-react"

import { MARK_COLOR } from "../cad/classify-dxf-color"
import type { PlacedPiece } from "../engine/types"
import { formatSheetRangeLabel } from "../utils/svg-render"
import { useNestingProject } from "../hooks/use-nesting-project"

import { Toolbar } from "./toolbar"
import { Sidebar } from "./sidebar"
import { SheetTabs, type SheetTabItem } from "./sheet-tabs"
import { PropertiesPanel } from "./properties-panel"
import { ExportDialog } from "./export-dialog"
import { PiecePreviewDialog } from "./piece-preview-dialog"
import { EntityExpandedToggle, type EntityExpandedToggleOption } from "@/shared/ui/entity-expanded-row/entity-expanded-toggle"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { useResponsive } from "@/shared/responsive/hooks/use-responsive"
import type { CadRow, PieceListHandle, PieceListProps } from "./piece-list"
import type { NestingPieceInput } from "../../engineering/components/dxf-canvas"

const DxfCanvas = dynamic(
  () => import("@/features/engineering/components/dxf-canvas").then((m) => m.DxfCanvas),
  { ssr: false }
)

type PanelView = "config" | "inspector"

const PANEL_OPTIONS: EntityExpandedToggleOption<PanelView>[] = [
  { value: "config", label: "Configuración", icon: Settings2 },
  { value: "inspector", label: "Propiedades", icon: Info },
]

export function NestingPage() {
  const { isCompact } = useResponsive()
  const project = useNestingProject()

  // Estados de UI
  const [previewRow, setPreviewRow] = useState<CadRow | null>(null)
  const [activeGroupIndex, setActiveGroupIndex] = useState<number>(0)
  const [selectedPieceIndex, setSelectedPieceIndex] = useState<number | null>(null)
  const [exportDialogOpen, setExportDialogOpen] = useState<boolean>(false)
  const [activePanel, setActivePanel] = useState<PanelView>("config")
  const [isMobilePanelOpen, setIsMobilePanelOpen] = useState<boolean>(false)
  const [marksHidden, setMarksHidden] = useState<boolean>(false)

  const projectInputRef = useRef<HTMLInputElement>(null)
  const pieceListRef = useRef<PieceListHandle>(null)

  // Sincronización robusta de layout: Si la pantalla deja de ser compacta, cerramos el drawer móvil
  useEffect(() => {
    if (!isCompact) {
      setIsMobilePanelOpen(false)
    }
  }, [isCompact])

  // Datos derivados del proyecto
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

  // Callbacks optimizados
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
      onAddManual: project.onAddManual,
      onAddCad: project.onAddCad,
      onRemove: project.onRemove,
      onUpdateManual: project.onUpdateManual,
      onUpdateQuantity: project.onUpdateQuantity,
      onPreviewRow: setPreviewRow,
      nextColor: project.nextColor,
    }),
    [project]
  )

  // Renderizado centralizado del contenido del panel para evitar duplicación y pérdida de contexto
  const renderSidePanelContent = () => (
    <div className="flex h-full flex-col gap-3">
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
              settings={project.settings}
              onSettingsChange={project.onSettingsChange}
              machine={project.machine}
              onMachineChange={project.onMachineChange}
              pieceListProps={pieceListProps}
              canRun={project.canRun}
              isRunning={project.isRunning}
              progress={project.progress}
              error={project.error}
              onRun={handleRun}
              onCancel={project.onCancel}
            />
          </ScrollArea>
        ) : (
          <ScrollArea className="h-full w-full rounded-xl bg-white/5 p-3">
            <PropertiesPanel
              sheetStats={sheetStats}
              selectedPiece={selectedPiece}
              espesor={project.settings.espesor}
              material={project.settings.material}
            />
          </ScrollArea>
        )}
      </div>
    </div>
  )

  return (
    <div className="flex min-h-[600px] flex-col tablet:h-full tablet:overflow-hidden">
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

      <div className="flex min-h-0 flex-1 gap-4 p-4">
        {/* Panel lateral estático para pantallas de escritorio */}
        {!isCompact && (
          <aside className="flex w-72 shrink-0 flex-col gap-3">
            {renderSidePanelContent()}
          </aside>
        )}

        {/* Área principal del Canvas y Pestañas */}
        <main className="flex min-h-0 flex-1 flex-col gap-2">
          {project.sheetGroups.length > 0 && (
            <SheetTabs
              items={sheetTabItems}
              activeIndex={activeGroupIndex}
              onChange={(i) => {
                setActiveGroupIndex(i)
                setSelectedPieceIndex(null)
              }}
            />
          )}

          <div className="min-h-[400px] flex-1 overflow-hidden rounded-2xl bg-neutral-900 tablet:min-h-0">
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

      {/* Sheet deslizante para dispositivos móviles o zoom comprimido */}
      <Sheet open={isCompact && isMobilePanelOpen} onOpenChange={setIsMobilePanelOpen}>
        <SheetContent className="flex flex-col gap-3 p-4">
          <SheetHeader className="p-0">
            <SheetTitle>Piezas y configuración</SheetTitle>
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