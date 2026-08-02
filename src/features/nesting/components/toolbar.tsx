"use client"

import {
  FilePlus2,
  FolderOpen,
  Save,
  FileInput,
  FileOutput,
  Layers,
  Settings,
  PanelLeftClose,
} from "lucide-react"

import {
  Button,
} from "@/components/ui/button"
import { useResponsive } from "@/shared/responsive/hooks/use-responsive"
import { PipelineScroll } from "@/shared/ui/pipeline-scroll/pipeline-scroll"

export interface ToolbarProps {
  onNew: () => void
  onOpen: () => void
  onSave: () => void
  onImport: () => void
  onExport: () => void
  onToggleLayers: () => void
  onSettings: () => void
  // Solo se pasa en layouts compactos (mobile/tablet), donde el
  // panel de piezas/configuración vive en un Sheet en vez de la
  // columna fija — ver NestingPage. Ausente en desktop, así que el
  // Toolbar no necesita saber nada de breakpoints por su cuenta.
  onTogglePanel?: () => void
}

function IconButton({
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
    <Button
      type="button"
      variant="ghost"
      size="icon-lg"
      onClick={onClick}
      disabled={disabled}
      title={title}
      aria-label={title}
      className="text-neutral-400 hover:bg-white/10 hover:text-white disabled:opacity-30"
    >
      {children}
    </Button>
  )
}

function Divider() {
  // Se reemplaza w-[1px] por la clase canónica w-px
  return <div className="mx-2 h-4 w-px bg-white/10" aria-hidden="true" />
}

export function Toolbar({
  onNew,
  onOpen,
  onSave,
  onImport,
  onExport,
  onToggleLayers,
  onSettings,
  onTogglePanel,
}: ToolbarProps) {
  const { isMobile } = useResponsive()

  const fileActions = (
    <div className="flex shrink-0 items-center gap-1">
      {/* Se reemplaza h-[18px] w-[18px] por h-5 w-5 (20px), la medida estándar de Tailwind más cercana */}
      {onTogglePanel && (
        <>
          <IconButton onClick={onTogglePanel} title="Piezas y configuración">
            <PanelLeftClose className="h-5 w-5 rotate-180" strokeWidth={1.5} />
          </IconButton>
          <Divider />
        </>
      )}
      <IconButton onClick={onNew} title="Nuevo proyecto">
        <FilePlus2 className="h-5 w-5" strokeWidth={1.5} />
      </IconButton>
      <IconButton onClick={onOpen} title="Abrir proyecto">
        <FolderOpen className="h-5 w-5" strokeWidth={1.5} />
      </IconButton>
      <IconButton onClick={onSave} title="Guardar proyecto">
        <Save className="h-5 w-5" strokeWidth={1.5} />
      </IconButton>

      <Divider />

      <IconButton onClick={onImport} title="Importar DXF/GEO">
        <FileInput className="h-5 w-5" strokeWidth={1.5} />
      </IconButton>
      <IconButton onClick={onExport} title="Exportar">
        <FileOutput className="h-5 w-5" strokeWidth={1.5} />
      </IconButton>
    </div>
  )

  const viewActions = (
    <div className="flex shrink-0 items-center gap-1">
      <IconButton onClick={onToggleLayers} title="Capas">
        <Layers className="h-5 w-5" strokeWidth={1.5} />
      </IconButton>
      <IconButton onClick={onSettings} title="Configuración">
        <Settings className="h-5 w-5" strokeWidth={1.5} />
      </IconButton>
    </div>
  )

  return (
    <div
      role="toolbar"
      aria-label="Controles del proyecto"
      // Se reemplaza bg-[#09090b] por bg-neutral-950 (el equivalente canónico más oscuro)
      className="flex h-14 w-full shrink-0 items-center border-b border-white/5 bg-neutral-950 px-4"
    >
      {isMobile ? (
        // Ambos grupos no entran en una fila angosta: en vez de
        // apretarlos con justify-between (se solaparían), pasan a
        // una única fila con scroll horizontal — mismo primitivo
        // que ya usa AdaptiveActionBar para este caso.
        <PipelineScroll className="items-center gap-1" fade drag>
          {fileActions}
          {viewActions}
        </PipelineScroll>
      ) : (
        <div className="flex w-full items-center justify-between">
          {fileActions}
          {viewActions}
        </div>
      )}
    </div>
  )
}