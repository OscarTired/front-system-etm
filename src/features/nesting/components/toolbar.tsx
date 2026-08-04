"use client"

import { memo } from "react"
import {
  FilePlus,
  FolderOpen,
  Save,
  FileDown,
  FileUp,
  Settings,
  SidebarClose,
} from "lucide-react"

import { Button, type ButtonProps } from "@/components/ui/button"
import { useResponsive } from "@/shared/responsive/hooks/use-responsive"
import { PipelineScroll } from "@/shared/ui/pipeline-scroll/pipeline-scroll"

export interface ToolbarProps {
  onNew: () => void
  onOpen: () => void
  onSave: () => void
  onImport: () => void
  onExport: () => void
  onToggleLayers?: () => void
  layersHidden?: boolean
  onSettings: () => void
  onTogglePanel?: () => void
}

interface ToolbarButtonProps extends ButtonProps {
  title: string
  active?: boolean
}

/**
 * Componente atómico interno para los botones de la barra de herramientas.
 * Mantiene la consistencia visual y de accesibilidad (ARIA).
 */
const ToolbarButton = memo(function ToolbarButton({
  title,
  active,
  className = "",
  ...props
}: ToolbarButtonProps) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-lg"
      title={title}
      aria-label={title}
      aria-pressed={active}
      className={`text-neutral-400 transition-colors hover:bg-white/10 hover:text-white disabled:opacity-30 ${
        active ? "bg-white/10 text-white" : ""
      } ${className}`}
      {...props}
    />
  )
})

/** Separador visual vertical optimizado con token canónico w-px */
const ToolbarDivider = memo(function ToolbarDivider() {
  return <div className="mx-2 h-4 w-px bg-white/10 shrink-0" aria-hidden="true" />
})

export const Toolbar = memo(function Toolbar({
  onNew,
  onOpen,
  onSave,
  onImport,
  onExport,
  onSettings,
  onTogglePanel,
}: ToolbarProps) {
  const { isCompact } = useResponsive()

  const renderFileActions = () => (
    <div className="flex shrink-0 items-center gap-1">
      {onTogglePanel && (
        <>
          <ToolbarButton onClick={onTogglePanel} title="Piezas y configuración">
            <SidebarClose className="h-5 w-5 rotate-180" strokeWidth={1.5} />
          </ToolbarButton>
          <ToolbarDivider />
        </>
      )}
      <ToolbarButton onClick={onNew} title="Nuevo proyecto">
        <FilePlus className="h-5 w-5" strokeWidth={1.5} />
      </ToolbarButton>
      <ToolbarButton onClick={onOpen} title="Abrir proyecto">
        <FolderOpen className="h-5 w-5" strokeWidth={1.5} />
      </ToolbarButton>
      <ToolbarButton onClick={onSave} title="Guardar proyecto">
        <Save className="h-5 w-5" strokeWidth={1.5} />
      </ToolbarButton>

      <ToolbarDivider />

      <ToolbarButton onClick={onImport} title="Importar DXF/GEO">
        <FileDown className="h-5 w-5" strokeWidth={1.5} />
      </ToolbarButton>
      <ToolbarButton onClick={onExport} title="Exportar">
        <FileUp className="h-5 w-5" strokeWidth={1.5} />
      </ToolbarButton>
    </div>
  )

  const renderViewActions = () => (
    <div className="flex shrink-0 items-center gap-1">
      <ToolbarButton onClick={onSettings} title="Configuración">
        <Settings className="h-5 w-5" strokeWidth={1.5} />
      </ToolbarButton>
    </div>
  )

  return (
    <nav
      role="toolbar"
      aria-label="Controles del proyecto"
      className="flex h-14 w-full shrink-0 items-center px-4"
    >
      {isCompact ? (
        <PipelineScroll className="items-center gap-1" fade drag>
          {renderFileActions()}
          {renderViewActions()}
        </PipelineScroll>
      ) : (
        <div className="flex w-full items-center justify-between">
          {renderFileActions()}
          {renderViewActions()}
        </div>
      )}
    </nav>
  )
})