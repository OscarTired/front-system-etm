"use client"

import { useEffect, useState } from "react"
import {
  ZoomIn,
  ZoomOut,
  Maximize,
  Target,
  Grid,
  Ruler,
  CircleDot,
  Triangle,
  Square,
  Crosshair,
  X,
  Magnet,
  Play,
  Pause,
  SkipBack,
  ChevronsRight,
  Wrench,
} from "lucide-react"
import type { MeasureTool } from "../types/types"
import { TOOL_LABELS } from "../types/types"

const mdBtn =
  "relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-neutral-300 transition-colors duration-150 hover:bg-white/10 hover:text-white active:bg-white/15 disabled:pointer-events-none disabled:opacity-30"
const mdBtnRed =
  "relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-neutral-400 transition-colors duration-150 hover:bg-red-500/20 hover:text-red-300 active:bg-red-500/25 disabled:pointer-events-none disabled:opacity-30"
const mdBtnActive = "bg-blue-500/20 text-blue-300 hover:bg-blue-500/25 hover:text-blue-300"
const mdDivider = "mx-0.5 h-5 w-px shrink-0 bg-white/10"

export interface CanvasToolbarProps {
  showGrid: boolean
  onToggleGrid: () => void
  onZoomIn: () => void
  onZoomOut: () => void
  onFit: () => void
  onFocusSelected: () => void
  canFocusSelected: boolean

  activeTool: MeasureTool
  onToggleTool: (tool: Exclude<MeasureTool, "none">) => void
  onResetTool: () => void
  snapEnabled: boolean
  onToggleSnap: () => void

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
}

export function CanvasToolbar({
  showGrid,
  onToggleGrid,
  onZoomIn,
  onZoomOut,
  onFit,
  onFocusSelected,
  canFocusSelected,
  activeTool,
  onToggleTool,
  onResetTool,
  snapEnabled,
  onToggleSnap,
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
}: CanvasToolbarProps) {
  const [open, setOpen] = useState(false)

  const handleClose = () => {
    onResetTool()
    onCloseSim()
    setOpen(false)
  }

  const isToolActive = activeTool !== "none"

  return (
    <div className="pointer-events-none absolute left-3 top-3 z-25 flex items-start gap-2">
      {/* FAB — siempre visible */}
      <button
        type="button"
        onClick={() => (open ? handleClose() : setOpen(true))}
        className={`
          pointer-events-auto flex h-10 w-10 shrink-0 items-center justify-center rounded-full
          shadow-[0_2px_8px_rgba(0,0,0,0.45),0_1px_2px_rgba(0,0,0,0.3)] backdrop-blur-md
          transition-all duration-200 ease-out
          ${
            open
              ? "bg-white/15 text-white ring-1 ring-white/20"
              : "bg-[#1c1c1e]/92 text-neutral-300 hover:bg-[#1c1c1e] hover:text-white"
          }
        `}
        title={open ? "Cerrar herramientas" : "Herramientas"}
        aria-expanded={open}
      >
        {open ? <X size={18} strokeWidth={1.75} /> : <Wrench size={18} strokeWidth={1.75} />}
      </button>

      {/* Panel principal con transición simple y unificada */}
      <div
        className={`
          pointer-events-auto flex items-center gap-0.5 overflow-hidden
          rounded-full bg-[#1c1c1e]/92 py-1 pl-1.5 pr-1.5
          shadow-[0_2px_8px_rgba(0,0,0,0.45),0_1px_2px_rgba(0,0,0,0.3)] backdrop-blur-md
          transition-all duration-300 ease-out
          ${open ? "max-w-200 opacity-100" : "max-w-0 opacity-0 pointer-events-none"}
        `}
      >
        {/* Vista */}
        <button type="button" onClick={onZoomIn} className={mdBtn} title="Acercar">
          <ZoomIn size={16} strokeWidth={1.75} />
        </button>
        <button type="button" onClick={onZoomOut} className={mdBtn} title="Alejar">
          <ZoomOut size={16} strokeWidth={1.75} />
        </button>
        <button type="button" onClick={onFit} className={mdBtn} title="Ajustar a la vista">
          <Maximize size={16} strokeWidth={1.75} />
        </button>
        <button
          type="button"
          onClick={onFocusSelected}
          disabled={!canFocusSelected}
          className={mdBtn}
          title="Centrar en selección"
        >
          <Target size={16} strokeWidth={1.75} />
        </button>

        <div className={mdDivider} />

        <button
          type="button"
          onClick={onToggleGrid}
          className={`${mdBtn} ${showGrid ? mdBtnActive : ""}`}
          title="Cuadrícula"
        >
          <Grid size={16} strokeWidth={1.75} />
        </button>

        <div className={mdDivider} />

        {/* Metrología */}
        {(
          [
            ["distance", Ruler],
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
                ? "bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500/25 hover:text-cyan-300"
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
              ? "bg-amber-500/20 text-amber-300 hover:bg-amber-500/25 hover:text-amber-300"
              : ""
          }`}
          title={snapEnabled ? "Snap activado" : "Snap desactivado"}
        >
          <Magnet size={16} strokeWidth={1.75} />
        </button>

        {/* Botón X de salida de herramienta con animación de expansión */}
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

        {/* Simulación */}
        {hasToolpath && (
          <>
            <div className={mdDivider} />

            {/* Botón para abrir simulación */}
            <button
              type="button"
              onClick={onOpenSim}
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

            {/* Subpanel de simulación unificado */}
            <div
              className={`
                flex items-center gap-0.5 overflow-hidden whitespace-nowrap
                transition-all duration-300 ease-out
                ${
                  simPanelOpen
                    ? "max-w-75 opacity-100"
                    : "max-w-0 opacity-0 pointer-events-none"
                }
              `}
            >
              <button
                type="button"
                onClick={onTogglePlay}
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
                className="mx-1 h-1 w-20 shrink-0 cursor-pointer appearance-none rounded-full bg-white/15 accent-cyan-400 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-cyan-400"
                title="Progreso de corte"
              />

              <select
                value={simSpeed}
                onChange={(e) => onSpeedChange(Number(e.target.value))}
                className="h-7 shrink-0 rounded-full border-0 bg-transparent px-1.5 text-[11px] text-neutral-300 outline-none hover:bg-white/5 focus:bg-white/5"
              >
                <option value={0.5} className="bg-[#1c1c1e]">0.5×</option>
                <option value={1} className="bg-[#1c1c1e]">1×</option>
                <option value={2} className="bg-[#1c1c1e]">2×</option>
                <option value={4} className="bg-[#1c1c1e]">4×</option>
              </select>

              <button
                type="button"
                onClick={onCloseSim}
                className={mdBtnRed}
                title="Cerrar simulación"
              >
                <X size={14} strokeWidth={2} />
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}