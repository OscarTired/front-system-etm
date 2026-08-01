"use client"

import {
  FilePlus2,
  FolderOpen,
  Save,
  FileInput,
  FileOutput,
  Play,
  X,
  RotateCw,
  ZoomIn,
  ZoomOut,
  Maximize,
  Layers,
  Settings,
} from "lucide-react"
import { Button } from "@/components/ui/button"

export interface ToolbarProps {
  onNew: () => void
  onOpen: () => void
  onSave: () => void
  onImport: () => void
  onExport: () => void
  onAutoNest: () => void
  onCancel: () => void
  onRecalculate: () => void
  onZoomIn: () => void
  onZoomOut: () => void
  onFit: () => void
  onToggleLayers: () => void
  onSettings: () => void
  isRunning: boolean
  canRun: boolean
}

function ToolbarButton({
  onClick,
  disabled,
  title,
  children,
}: {
  onClick: () => void
  disabled?: boolean
  title: string
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-neutral-300 transition-colors hover:bg-white/8 hover:text-white disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent"
    >
      {children}
    </button>
  )
}

function Divider() {
  return <div className="mx-1 h-5 w-px bg-white/8" aria-hidden />
}

export function Toolbar({
  onNew,
  onOpen,
  onSave,
  onImport,
  onExport,
  onAutoNest,
  onCancel,
  onRecalculate,
  onZoomIn,
  onZoomOut,
  onFit,
  onToggleLayers,
  onSettings,
  isRunning,
  canRun,
}: ToolbarProps) {
  return (
    <div className="flex h-12 shrink-0 items-center gap-0.5 border-b border-white/8 bg-[#0a0a0c] px-3">
      <span className="mr-3 text-xs font-bold uppercase tracking-widest text-neutral-500">Nesting</span>

      <ToolbarButton onClick={onNew} title="Nuevo proyecto">
        <FilePlus2 className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton onClick={onOpen} title="Abrir proyecto">
        <FolderOpen className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton onClick={onSave} title="Guardar proyecto">
        <Save className="h-4 w-4" />
      </ToolbarButton>

      <Divider />

      <ToolbarButton onClick={onImport} title="Importar DXF/GEO">
        <FileInput className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton onClick={onExport} title="Exportar">
        <FileOutput className="h-4 w-4" />
      </ToolbarButton>

      <Divider />

      {!isRunning ? (
        <Button size="sm" onClick={onAutoNest} disabled={!canRun}>
          <Play className="h-3.5 w-3.5" />
          Nido automático
        </Button>
      ) : (
        <>
          <Button size="sm" variant="outline" onClick={onCancel}>
            <X className="h-3.5 w-3.5" />
            Cancelar
          </Button>
          <ToolbarButton onClick={onRecalculate} title="Recalcular" disabled>
            <RotateCw className="h-4 w-4" />
          </ToolbarButton>
        </>
      )}

      <div className="flex-1" />

      <ToolbarButton onClick={onZoomOut} title="Alejar">
        <ZoomOut className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton onClick={onZoomIn} title="Acercar">
        <ZoomIn className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton onClick={onFit} title="Adaptar a la vista">
        <Maximize className="h-4 w-4" />
      </ToolbarButton>

      <Divider />

      <ToolbarButton onClick={onToggleLayers} title="Capas">
        <Layers className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton onClick={onSettings} title="Configuración">
        <Settings className="h-4 w-4" />
      </ToolbarButton>
    </div>
  )
}
