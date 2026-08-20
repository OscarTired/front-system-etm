import {
  MousePointer2, Hand, Ruler, Trash2, Undo2, Redo2,
  ZoomIn, ZoomOut, Maximize, Send, Copy, RotateCw, Magnet,
  Minus, Circle, Square, Spline,
} from "lucide-react"
import type { Tool } from "../types"

interface ToolbarProps {
  tool: Tool
  onToolChange: (tool: Tool) => void
  onUndo: () => void
  onRedo: () => void
  canUndo: boolean
  canRedo: boolean
  onZoomIn: () => void
  onZoomOut: () => void
  onFit: () => void
  onDelete: () => void
  onCopy: () => void
  onRotate: () => void
  onSendToAI: () => void
  aiSelectCount: number
  selectedCount: number
  snapEnabled: boolean
  onToggleSnap: () => void
}

const TOOLS: { tool: Tool; icon: typeof MousePointer2; label: string; group?: string }[] = [
  { tool: "select", icon: MousePointer2, label: "Seleccionar" },
  { tool: "pan", icon: Hand, label: "Pan" },
  { tool: "measure", icon: Ruler, label: "Medir" },
  { tool: "ai-select", icon: Send, label: "Seleccionar para IA" },
  { tool: "add-line", icon: Minus, label: "Línea", group: "add" },
  { tool: "add-circle", icon: Circle, label: "Círculo", group: "add" },
  { tool: "add-rectangle", icon: Square, label: "Rectángulo", group: "add" },
  { tool: "add-fold", icon: Spline, label: "Pliegue", group: "add" },
]

export function Toolbar({
  tool, onToolChange, onUndo, onRedo, canUndo, canRedo,
  onZoomIn, onZoomOut, onFit, onDelete, onCopy, onRotate,
  onSendToAI, aiSelectCount, selectedCount,
  snapEnabled, onToggleSnap,
}: ToolbarProps) {
  return (
    <div className="flex flex-wrap items-center gap-1 px-2 sm:px-3 py-1.5 border-b border-border bg-card">
      {TOOLS.map((t) => {
        const Icon = t.icon
        const isActive = tool === t.tool
        const showBadge = t.tool === "ai-select" && aiSelectCount > 0
        return (
          <button
            key={t.tool}
            onClick={() => onToolChange(t.tool)}
            className={`relative flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors ${
              isActive
                ? "bg-primary text-primary-foreground"
                : "text-foreground hover:bg-secondary"
            }`}
            title={t.label}
          >
            <Icon className="w-4 h-4" />
            {t.tool.startsWith("add-") && <span className="hidden lg:inline">{t.label}</span>}
            {!t.tool.startsWith("add-") && t.tool !== "ai-select" && <span className="hidden lg:inline">{t.label}</span>}
            {t.tool === "ai-select" && <span className="hidden lg:inline">IA</span>}
            {showBadge && (
              <span className="absolute -top-1 -right-1 bg-orange-500 text-white text-[9px] rounded-full w-4 h-4 flex items-center justify-center font-bold">
                {aiSelectCount}
              </span>
            )}
          </button>
        )
      })}

      <div className="w-px h-6 bg-border mx-1" />

      <button
        onClick={onToggleSnap}
        className={`flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors ${
          snapEnabled
            ? "bg-primary/10 text-primary ring-1 ring-primary/40"
            : "text-muted-foreground hover:bg-secondary"
        }`}
        title="Imán: ajustar a extremos, puntos medios, centros y bordes (S)"
      >
        <Magnet className="w-4 h-4" />
        <span className="hidden lg:inline">Imán</span>
      </button>

      <div className="w-px h-6 bg-border mx-1" />

      <button
        onClick={onCopy}
        disabled={selectedCount === 0}
        className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium text-foreground hover:bg-secondary transition-colors disabled:opacity-40"
        title="Copiar (Ctrl+C)"
      >
        <Copy className="w-4 h-4" />
      </button>
      <button
        onClick={onRotate}
        disabled={selectedCount === 0}
        className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium text-foreground hover:bg-secondary transition-colors disabled:opacity-40"
        title="Rotar"
      >
        <RotateCw className="w-4 h-4" />
      </button>
      <button
        onClick={onDelete}
        disabled={selectedCount === 0}
        className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium text-foreground hover:bg-destructive/10 hover:text-destructive transition-colors disabled:opacity-40"
        title="Eliminar (Del)"
      >
        <Trash2 className="w-4 h-4" />
      </button>

      <div className="w-px h-6 bg-border mx-1" />

      <button
        onClick={onUndo}
        disabled={!canUndo}
        className="flex items-center rounded-md px-2.5 py-1.5 text-xs font-medium text-foreground hover:bg-secondary transition-colors disabled:opacity-40"
        title="Deshacer (Ctrl+Z)"
      >
        <Undo2 className="w-4 h-4" />
      </button>
      <button
        onClick={onRedo}
        disabled={!canRedo}
        className="flex items-center rounded-md px-2.5 py-1.5 text-xs font-medium text-foreground hover:bg-secondary transition-colors disabled:opacity-40"
        title="Rehacer (Ctrl+Y)"
      >
        <Redo2 className="w-4 h-4" />
      </button>

      <div className="flex-1" />

      <button
        onClick={onZoomOut}
        className="flex items-center rounded-md px-2 py-1.5 text-foreground hover:bg-secondary transition-colors"
        title="Alejar"
      >
        <ZoomOut className="w-4 h-4" />
      </button>
      <button
        onClick={onFit}
        className="flex items-center rounded-md px-2 py-1.5 text-foreground hover:bg-secondary transition-colors"
        title="Ajustar"
      >
        <Maximize className="w-4 h-4" />
      </button>
      <button
        onClick={onZoomIn}
        className="flex items-center rounded-md px-2 py-1.5 text-foreground hover:bg-secondary transition-colors"
        title="Acercar"
      >
        <ZoomIn className="w-4 h-4" />
      </button>

      {aiSelectCount > 0 && (
        <>
          <div className="w-px h-6 bg-border mx-1" />
          <button
            onClick={onSendToAI}
            className="flex items-center gap-1.5 rounded-md bg-orange-500 text-white px-3 py-1.5 text-xs font-medium hover:bg-orange-600 transition-colors"
          >
            <Send className="w-3.5 h-3.5" />
            Enviar al chat ({aiSelectCount})
          </button>
        </>
      )}
    </div>
  )
}
