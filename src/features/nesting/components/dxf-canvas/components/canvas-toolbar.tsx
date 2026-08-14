"use client"

import { useCallback, useEffect, useState } from "react"
import { useResponsive } from "@/shared/responsive/hooks/use-responsive"
import {
  ZoomIn,
  ZoomOut,
  Maximize,
  Target,
  Ruler,
  CircleDot,
  Triangle,
  Square,
  Crosshair,
  Scan,
  X,
  Magnet,
  Play,
  Pause,
  SkipBack,
  ChevronsRight,
  Wrench,
  ChevronDown,
  Hash,
  Plus,
  Ban,
  Eye,
  EyeOff,
  Move,
  MoveHorizontal,
} from "lucide-react"
import type { MeasureTool, CanvasTool, TransformMode } from "../types/types"
import { TOOL_LABELS } from "../types/types"
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover"

const mdBtn =
  "relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors duration-150 hover:bg-foreground/10 hover:text-foreground active:bg-foreground/15 disabled:pointer-events-none disabled:opacity-30"
const mdBtnRed =
  "relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-destructive transition-colors duration-150 hover:bg-destructive/15 active:bg-destructive/20 disabled:pointer-events-none disabled:opacity-30"
const mdBtnActive = "bg-blue-500/20 text-blue-300 hover:bg-blue-500/25 hover:text-blue-300"
const mdDivider = "mx-0.5 h-5 w-px shrink-0 bg-foreground/10"

export interface CanvasToolbarProps {
  showGrid: boolean
  onToggleGrid: () => void
  onZoomIn: () => void
  onZoomOut: () => void
  onFit: () => void
  onFocusSelected: () => void
  canFocusSelected: boolean

  canvasTool?: CanvasTool
  onCanvasToolChange?: (tool: CanvasTool) => void

  activeTool: MeasureTool
  onToggleTool: (tool: Exclude<MeasureTool, "none">) => void
  onResetTool: () => void
  snapEnabled: boolean
  onToggleSnap: () => void

  /** Movimiento libre vs restringido a un eje dominante (ortogonal). */
  transformMode?: TransformMode
  onTransformModeChange?: (mode: TransformMode) => void

  /** Estilo del fondo del canvas (cuadrícula). */
  gridStyle?: "dots" | "lines" | "cross" | "none"
  onGridStyleChange?: (style: "dots" | "lines" | "cross" | "none") => void

  hasToolpath: boolean
  simPanelOpen: boolean
  simRunning: boolean
  simProgress: number
  simSpeed: number
  onOpenSim: () => void
  onCloseSim: () => void
  onTogglePlay: () => void
  onResetSim: () => void
  onSeek: (v: number) => void
  onSpeedChange: (v: number) => void

  /** Auto-cota del bbox de la selección. */
  onAutoBboxDim?: () => void
  canAutoBboxDim?: boolean

  /** Avisa si la barra de tools está expandida (para mover chrome colindante). */
  onOpenChange?: (open: boolean) => void
}

const SPEEDS = [0.5, 1, 2, 4] as const

export function CanvasToolbar({
  showGrid,
  onToggleGrid,
  onZoomIn,
  onZoomOut,
  onFit,
  onFocusSelected,
  canFocusSelected,
  canvasTool = "select",
  onCanvasToolChange,
  activeTool,
  onToggleTool,
  onResetTool,
  snapEnabled,
  onToggleSnap,
  transformMode = "free",
  onTransformModeChange,
  gridStyle = "dots",
  onGridStyleChange,
  hasToolpath,
  simPanelOpen,
  simRunning,
  simProgress,
  simSpeed,
  onOpenSim,
  onCloseSim,
  onTogglePlay,
  onResetSim,
  onSeek,
  onSpeedChange,
  onAutoBboxDim,
  canAutoBboxDim = false,
  onOpenChange,
}: CanvasToolbarProps) {
  const [open, setOpen] = useState(false)
  const [speedPopoverOpen, setSpeedPopoverOpen] = useState(false)
  const [displayOpen, setDisplayOpen] = useState(false)
  const { isCompact } = useResponsive()

  const isToolActive = activeTool !== "none"

  useEffect(() => {
    onOpenChange?.(open)
  }, [open, onOpenChange])

  // Auto-abre el panel al seleccionar una pieza. No auto-cierra al deseleccionar.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (canFocusSelected) setOpen(true)
  }, [canFocusSelected])

  const handleClose = () => {
    onResetTool()
    onCloseSim()
    setSpeedPopoverOpen(false)
    setOpen(false)
  }

  return (
    <div
      className={`pointer-events-none absolute left-3 top-3 z-25 flex flex-col items-start gap-2 ${
        isCompact ? "right-3" : ""
      }`}
    >
      {/* Fila superior: FAB + barra de herramientas */}
      <div className={`flex items-start gap-2 ${isCompact ? "w-full" : ""}`}>
        <button
          type="button"
          onClick={() => (open ? handleClose() : setOpen(true))}
          className={`
            pointer-events-auto flex h-10 w-10 shrink-0 items-center justify-center rounded-full
            backdrop-blur-md
            transition-all duration-200 ease-out
            ${
              open
                ? "bg-background text-foreground"
                : "bg-background/90 text-muted-foreground hover:bg-background hover:text-foreground"
            }
          `}
          title={open ? "Cerrar herramientas" : "Herramientas"}
          aria-expanded={open}
        >
          {open ? <X size={18} strokeWidth={1.75} /> : <Wrench size={18} strokeWidth={1.75} />}
        </button>

        {/* Ancho real desde el primer frame (sin max-w→grow).
            Animar max-width hacía wrap de 1 col = columna enorme al abrir. */}
        {open && (
        <div
          className={`
            min-w-0 animate-in fade-in duration-200
            ${isCompact ? "flex-1" : "max-w-[min(52rem,calc(100vw-6rem))]"}
          `}
        >
        <div
          className="
            pointer-events-auto flex max-w-full flex-wrap items-center gap-0.5
            rounded-2xl border border-foreground/10 bg-background/90 py-1 pl-1.5 pr-1.5
            backdrop-blur-md
          "
        >
          {/* Vista */}
          <button type="button" onClick={onZoomIn} className={`${mdBtn}`} title="Acercar">
            <ZoomIn size={16} strokeWidth={1.75} />
          </button>
          <button type="button" onClick={onZoomOut} className={`${mdBtn}`} title="Alejar">
            <ZoomOut size={16} strokeWidth={1.75} />
          </button>
          <button type="button" onClick={onFit} className={`${mdBtn}`} title="Ajustar a la vista">
            <Maximize size={16} strokeWidth={1.75} />
          </button>
          <button
            type="button"
            onClick={onFocusSelected}
            disabled={!canFocusSelected}
            className={`${mdBtn}`}
            title="Centrar en selección"
          >
            <Target size={16} strokeWidth={1.75} />
          </button>
          <button
            type="button"
            onClick={onAutoBboxDim}
            disabled={!canAutoBboxDim || !onAutoBboxDim}
            className={`${mdBtn}`}
            title="Auto-cota bbox (selección)"
          >
            <Square size={16} strokeWidth={1.75} />
          </button>

          <div className={mdDivider} />

          <button
            type="button"
            onClick={onToggleGrid}
            className={`${mdBtn} ${showGrid ? mdBtnActive : ""}`}
            title={showGrid ? "Ocultar fondo" : "Mostrar fondo"}
          >
            {showGrid ? (
              <Eye size={16} strokeWidth={1.75} />
            ) : (
              <EyeOff size={16} strokeWidth={1.75} />
            )}
          </button>

          {onGridStyleChange && (
            <Popover open={displayOpen} onOpenChange={setDisplayOpen}>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className={`${mdBtn} ${showGrid && gridStyle !== "none" ? mdBtnActive : ""}`}
                  title="Estilo de fondo"
                >
                  {gridStyle === "lines" ? (
                    <Hash size={16} strokeWidth={1.75} />
                  ) : gridStyle === "cross" ? (
                    <Plus size={16} strokeWidth={1.75} />
                  ) : gridStyle === "none" ? (
                    <Ban size={16} strokeWidth={1.75} />
                  ) : (
                    <CircleDot size={16} strokeWidth={1.75} />
                  )}
                </button>
              </PopoverTrigger>
              <PopoverContent
                side="bottom"
                align="start"
                floatingClassName="w-48 border-border"
                className="p-1.5 text-foreground"
              >
                <p className="px-2 py-1.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                  Fondo
                </p>
                {(
                  [
                    { style: "dots" as const, label: "Puntos", icon: CircleDot },
                    { style: "lines" as const, label: "Líneas", icon: Hash },
                    { style: "cross" as const, label: "Cruces", icon: Plus },
                    { style: "none" as const, label: "Ninguno", icon: Ban },
                  ] as const
                ).map(({ style, label, icon: Icon }) => (
                  <button
                    key={style}
                    type="button"
                    onClick={() => {
                      onGridStyleChange(style)
                      if (style === "none") {
                        if (showGrid) onToggleGrid()
                      } else if (!showGrid) {
                        onToggleGrid()
                      }
                      setDisplayOpen(false)
                    }}
                    className={`flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-xs transition-colors hover:bg-foreground/10 ${
                      (showGrid ? gridStyle : "none") === style
                        ? "bg-foreground/10 text-foreground"
                        : "text-muted-foreground"
                    }`}
                  >
                    <Icon size={14} className="opacity-70" />
                    {label}
                  </button>
                ))}
              </PopoverContent>
            </Popover>
          )}

          <div className={mdDivider} />

          {/* Metrología */}
          {(
            [
              ["distance", Ruler],
              ["smart", Scan],
              ["radius", CircleDot],
              ["angle", Triangle],
              ["area", Square],
              ["coords", Crosshair],
            ] as const
          ).map(([tool, Icon]) => (
            <button
              key={tool}
              type="button"
              onClick={() => onToggleTool(tool as Exclude<MeasureTool, "none">)}
              className={`${mdBtn} ${
                activeTool === tool
                  ? "bg-primary/15 text-primary hover:bg-primary/20 hover:text-primary"
                  : ""
              }`}
              title={TOOL_LABELS[tool]}
            >
              <Icon size={16} strokeWidth={1.75} />
            </button>
          ))}

          <button
            type="button"
            onClick={onToggleSnap}
            className={`${mdBtn} ${
              snapEnabled
                ? "bg-amber-500/20 text-amber-800 dark:text-amber-300 hover:bg-amber-500/25 hover:text-amber-800 dark:text-amber-300"
                : ""
            }`}
            title={snapEnabled ? "Snap activado" : "Snap desactivado"}
          >
            <Magnet size={16} strokeWidth={1.75} />
          </button>

          {onTransformModeChange && (
            <button
              type="button"
              onClick={() =>
                onTransformModeChange(transformMode === "free" ? "geometric" : "free")
              }
              className={`${mdBtn} ${
                transformMode === "geometric"
                  ? "bg-primary/15 text-primary hover:bg-primary/20 hover:text-primary"
                  : ""
              }`}
              title={
                transformMode === "free"
                  ? "Movimiento libre (clic para restringir a un eje)"
                  : "Movimiento restringido a un eje (clic para mover libre)"
              }
            >
              {transformMode === "free" ? (
                <Move size={16} strokeWidth={1.75} />
              ) : (
                <MoveHorizontal size={16} strokeWidth={1.75} />
              )}
            </button>
          )}

          {/* Salir de herramienta de medida */}
          <div
            className={`
              flex items-center overflow-hidden transition-all duration-300 ease-out
              ${isToolActive ? "max-w-10 opacity-100" : "max-w-0 opacity-0 pointer-events-none"}
            `}
          >
            <button
              type="button"
              onClick={onResetTool}
              className={mdBtnRed}
              title="Salir de herramienta"
            >
              <X size={14} strokeWidth={2} />
            </button>
          </div>

          {/* Simulación — botón disparador */}
          {hasToolpath && (
            <>
              <div className={mdDivider} />
              <button
                type="button"
                onClick={() => {
                  setOpen(true)
                  onOpenSim()
                }}
                className={`${mdBtn} transition-all duration-200 ${
                  simPanelOpen
                    ? "w-0 opacity-0 pointer-events-none p-0 m-0 overflow-hidden"
                    : "w-9 opacity-100"
                }`}
                title="Simulación de corte"
                tabIndex={simPanelOpen ? -1 : 0}
              >
                <ChevronsRight size={16} strokeWidth={1.75} />
              </button>
            </>
          )}
        </div>
        </div>
        )}
      </div>

      {/* Subpanel de simulación — independiente de la barra de tools
          (si dependía de `open`, en móvil al colapsar tools el play moría). */}
      {hasToolpath && (
        <div
          className={`
            pointer-events-auto flex min-w-0 items-center gap-1 overflow-hidden rounded-2xl
            bg-background/95 py-1.5 pl-2 pr-1.5
            backdrop-blur-md
            transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] origin-top
            ${isCompact ? "w-full max-w-full" : ""}
            ${
              simPanelOpen
                ? "max-h-20 opacity-100 translate-y-0 scale-100"
                : "max-h-0 opacity-0 -translate-y-2 scale-95 pointer-events-none py-0"
            }
          `}
        >
          <button
            type="button"
            onClick={onTogglePlay}
            onPointerDown={(e) => e.stopPropagation()}
            className={mdBtn}
            title={simRunning ? "Pausar" : "Reproducir"}
          >
            {simRunning ? (
              <Pause size={15} strokeWidth={1.75} />
            ) : (
              <Play size={15} strokeWidth={1.75} />
            )}
          </button>

          <button
            type="button"
            onClick={onResetSim}
            onPointerDown={(e) => e.stopPropagation()}
            disabled={simProgress === 0 && !simRunning}
            className={mdBtn}
            title="Reiniciar"
          >
            <SkipBack size={14} strokeWidth={1.75} />
          </button>

          <input
            type="range"
            min={0}
            max={1}
            step={0.001}
            value={simProgress}
            onChange={(e) => onSeek(Number(e.target.value))}
            onPointerDown={(e) => e.stopPropagation()}
            className="mx-1 h-1 min-w-0 flex-1 cursor-pointer appearance-none rounded-full bg-foreground/15 accent-primary touch-pan-x [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary"
            title="Progreso de corte"
          />

          <Popover open={speedPopoverOpen} onOpenChange={setSpeedPopoverOpen}>
            <PopoverTrigger asChild>
              <button
                type="button"
                className="flex h-7 w-15 items-center justify-center gap-1 rounded-full bg-foreground/5 px-2.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-foreground/10 hover:text-foreground"
                title="Velocidad de simulación"
              >
                <span>{simSpeed}×</span>
                <ChevronDown
                  size={12}
                  className={`transition-transform duration-200 ${speedPopoverOpen ? "rotate-180" : ""}`}
                />
              </button>
            </PopoverTrigger>
            <PopoverContent
              side="bottom"
              align="center"
              sideOffset={8}
              floatingClassName="w-24"
              className="p-1 text-foreground"
            >
              <div className="flex flex-col gap-0.5">
                {SPEEDS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => {
                      onSpeedChange(s)
                      setSpeedPopoverOpen(false)
                    }}
                    className={`flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-xs transition-colors ${
                      simSpeed === s
                        ? "bg-primary/15 font-semibold text-primary"
                        : "text-muted-foreground hover:bg-foreground/10 hover:text-foreground"
                    }`}
                  >
                    <span>{s}×</span>
                  </button>
                ))}
              </div>
            </PopoverContent>
          </Popover>

          <div className={mdDivider} />

          <button
            type="button"
            onClick={onCloseSim}
            className={mdBtnRed}
            title="Cerrar simulación"
          >
            <X size={14} strokeWidth={2} />
          </button>
        </div>
      )}
    </div>
  )
}
