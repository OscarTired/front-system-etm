"use client"

import {
  FilePlus2,
  FolderOpen,
  Save,
  FileInput,
  FileOutput,
  Layers,
  Settings,
} from "lucide-react"

export interface ToolbarProps {
  onNew: () => void
  onOpen: () => void
  onSave: () => void
  onImport: () => void
  onExport: () => void
  onToggleLayers: () => void
  onSettings: () => void
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
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      aria-label={title}
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-neutral-400 transition-colors duration-200 hover:bg-white/10 hover:text-white disabled:pointer-events-none disabled:opacity-30"
    >
      {children}
    </button>
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
}: ToolbarProps) {
  return (
    <div 
      role="toolbar" 
      aria-label="Controles del proyecto"
      // Se reemplaza bg-[#09090b] por bg-neutral-950 (el equivalente canónico más oscuro)
      className="flex h-14 w-full shrink-0 items-center justify-between border-b border-white/5 bg-neutral-950 px-4"
    >
      {/* Grupo Izquierdo: Acciones de Archivo */}
      <div className="flex items-center gap-1">
        {/* Se reemplaza h-[18px] w-[18px] por h-5 w-5 (20px), la medida estándar de Tailwind más cercana */}
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

      {/* Grupo Derecho: Configuraciones y Vistas */}
      <div className="flex items-center gap-1">
        <IconButton onClick={onToggleLayers} title="Capas">
          <Layers className="h-5 w-5" strokeWidth={1.5} />
        </IconButton>
        <IconButton onClick={onSettings} title="Configuración">
          <Settings className="h-5 w-5" strokeWidth={1.5} />
        </IconButton>
      </div>
    </div>
  )
}