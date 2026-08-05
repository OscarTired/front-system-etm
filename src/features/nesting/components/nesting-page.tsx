"use client"

import dynamic from "next/dynamic"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Layers, Info, Loader2, AlignLeft, AlignRight, AlignCenterHorizontal, AlignStartVertical, AlignEndVertical, AlignCenterVertical, LayoutGrid, SlidersHorizontal, RotateCcw, X, Trash2 } from "lucide-react"

import { boundingRect, rotateOutlineAroundPoint } from "../engine/geometry"
import { piecesCollide } from "../engine/polygon-collision"
import type { PlacedPiece, NestedSheet } from "../engine/types"
import type { BridgeSettings } from "../export/dxf-export"
import { formatSheetRangeLabel } from "../utils/svg-render"
import { useNestingProject } from "../hooks/use-nesting-project"
import { useSheetHistory } from "../hooks/use-sheet-history"
import { constrainToMode } from "../utils/transform-mode"

import { Toolbar } from "./toolbar"
import { SheetTabs, type SheetTabItem } from "./sheet-tabs"
import { PropertiesPanel } from "./properties-panel"
import { ExportDialog } from "./export-dialog"
import { ProjectDialog } from "./project-dialog"
import { PiecePreviewDialog } from "./piece-preview-dialog"
import { SheetDimensionsFields, MaterialPanel } from "./material-panel"
import { PieceList, type CadRow, type PieceListHandle, type PieceListProps } from "./piece-list"
import { PieceListRow } from "./piece-list-row"
import { EntityExpandedToggle, type EntityExpandedToggleOption } from "@/shared/ui/entity-expanded-row/entity-expanded-toggle"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
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
  const history = useSheetHistory()

  // Mantener referencias actualizadas de project/history para poder leerlas
  // dentro de efectos sin tener que incluir los objetos completos en el
  // array de dependencias (su identidad puede cambiar entre renders).
  const projectRef = useRef(project)
  useEffect(() => {
    projectRef.current = project
  })
  const historyRef = useRef(history)
  const deleteSelectedRef = useRef<(() => void) | null>(null)
  /** Selección a aplicar tras cambiar de tab (p.ej. Ubicar). */
  const pendingSelectRef = useRef<number[] | null>(null)
  useEffect(() => {
    historyRef.current = history
  })

  const [previewRowId, setPreviewRowId] = useState<string | null>(null)
  const [activeGroupIndex, setActiveGroupIndex] = useState<number>(0)
  const [selectedPieceIndices, setSelectedPieceIndices] = useState<number[]>([])
  const [lockedPieceIndices, setLockedPieceIndices] = useState<number[]>([])
  const offsetsClipboardRef = useRef<{ dx: number; dy: number; angle: number } | null>(null)
  const [offsetsClipboardVersion, setOffsetsClipboardVersion] = useState(0)
  const [exportDialogOpen, setExportDialogOpen] = useState<boolean>(false)
  const [projectDialogOpen, setProjectDialogOpen] = useState(false)
  const [projectDialogMode, setProjectDialogMode] = useState<"save" | "open">("save")
  const [activePanel, setActivePanel] = useState<PanelView>("sheet-pieces")
  const [isMobilePanelOpen, setIsMobilePanelOpen] = useState<boolean>(false)
  const [hiddenLayerKeys, setHiddenLayerKeys] = useState<Set<string>>(new Set())
  const [transformMode, setTransformMode] = useState<"free" | "geometric">("free")
  const [rotationStep, setRotationStep] = useState<15 | 45 | 90 | 180>(90)
  const [dismissedRestoredBanner, setDismissedRestoredBanner] = useState<boolean>(false)
  const [pendingDelete, setPendingDelete] = useState(false)

  const positionOverrides = history.positionOverrides
  const angleOverrides = history.angleOverrides

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

  // Atajos: Ctrl+Z / Ctrl+Shift+Z, Supr = eliminar de plancha
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
      const mod = e.ctrlKey || e.metaKey
      const key = e.key.toLowerCase()
      if (mod) {
        if (key === "z" && !e.shiftKey) {
          e.preventDefault()
          history.undo()
        } else if ((key === "z" && e.shiftKey) || key === "y") {
          e.preventDefault()
          history.redo()
        }
        return
      }
      if (e.key === "Delete" || e.key === "Backspace") {
        e.preventDefault()
        // handleDeleteSelected se lee vía ref para no re-bind cada render
        deleteSelectedRef.current?.()
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [history])

  // Restaurar edits + tab desde draft (una sola vez)
  const editsHydratedRef = useRef(false)
  useEffect(() => {
    if (!project.sessionReady || editsHydratedRef.current) return
    editsHydratedRef.current = true
    if (!project.sessionRestored) return
    const idx = project.getActiveGroupIndexForSession()
    if (typeof idx === "number" && idx >= 0) setActiveGroupIndex(idx)
    const edits = project.getSheetEdits()
    const key = String(idx ?? 0)
    const snap = edits[key]
    if (snap) {
      history.replace({
        positionOverrides: snap.positionOverrides ?? {},
        angleOverrides: snap.angleOverrides ?? {},
      })
      setLockedPieceIndices(snap.lockedIndices ?? [])
    } else {
      history.resetAll?.() ?? history.reset()
      setLockedPieceIndices([])
    }
  }, [project.sessionReady, project.sessionRestored, history, project])

  // Persistir edits de la plancha activa usando ref para evitar loops
  useEffect(() => {
    const p = projectRef.current
    if (!p.sessionReady || !editsHydratedRef.current) return
    const key = String(activeGroupIndex)
    const prev = p.getSheetEdits()
    p.setSheetEdits({
      ...prev,
      [key]: { positionOverrides, angleOverrides, lockedIndices: lockedPieceIndices },
    })
    p.setActiveGroupIndexForSession(activeGroupIndex)
    p.requestSessionSave()
  }, [positionOverrides, angleOverrides, lockedPieceIndices, activeGroupIndex])

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

  // Cambio de plancha: stack de undo/redo **independiente** por tab.
  // setActiveKey solo cambia el stack activo (no borra el historial de otras planchas).
  useEffect(() => {
    const h = historyRef.current
    const p = projectRef.current
    h.setActiveKey(activeGroupIndex)
    // Si el stack de esta plancha está vacío, hidratar desde snapshot de sesión
    const snap = p.getSheetEdits()[String(activeGroupIndex)]
    const empty =
      Object.keys(h.positionOverrides).length === 0 &&
      Object.keys(h.angleOverrides).length === 0
    if (
      empty &&
      snap &&
      (Object.keys(snap.positionOverrides).length > 0 ||
        Object.keys(snap.angleOverrides).length > 0)
    ) {
      h.replace({
        positionOverrides: snap.positionOverrides ?? {},
        angleOverrides: snap.angleOverrides ?? {},
      })
    }
    // Ubicar: no borrar la selección pendiente
    if (pendingSelectRef.current) {
      setSelectedPieceIndices(pendingSelectRef.current)
      pendingSelectRef.current = null
    } else {
      setSelectedPieceIndices([])
    }
  }, [activeGroupIndex])

  // Si se borró la última pieza de una plancha, el grupo desaparece → ajustar tab
  useEffect(() => {
    if (project.sheetGroups.length === 0) {
      setActiveGroupIndex(0)
      return
    }
    if (activeGroupIndex >= project.sheetGroups.length) {
      setActiveGroupIndex(project.sheetGroups.length - 1)
    }
  }, [project.sheetGroups.length, activeGroupIndex])

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
        thicknessMm: group.sheet.thicknessMm,
      })),
    [project.sheetGroups, project.getSheetStats]
  )

  const sheetStats = project.getSheetStats(activeGroupIndex)
  const selectedPiece = selectedPieceIndices.length > 0
    ? canvasPieces[selectedPieceIndices[selectedPieceIndices.length - 1]] ?? null
    : null

  const selectedPieceName = useMemo(() => {
    if (!selectedPiece) return null
    const row = project.rows.find((r) => r.id === selectedPiece.pieceId)
    return row?.fileName ?? selectedPiece.pieceId
  }, [selectedPiece, project.rows])

  const selectedCadRow = useMemo(() => {
    if (!selectedPiece) return null
    return project.rows.find((r) => r.id === selectedPiece.pieceId) ?? null
  }, [selectedPiece, project.rows])

  const highlightedIds = useMemo(() => {
    const set = new Set<string>()
    for (const idx of selectedPieceIndices) {
      const p = canvasPieces[idx]
      if (p?.pieceId) set.add(p.pieceId)
    }
    return set
  }, [selectedPieceIndices, canvasPieces])

  const pieceMaterialsSummary = useMemo(() => {
    const thicks = new Set<number>()
    const mats = new Set<string>()
    for (const r of project.rows) {
      const t = r.material?.thickness
      if (typeof t === "number" && t > 0) thicks.add(Math.round(t * 100) / 100)
      const din = r.material?.dinNorm
      const alloy = r.material?.alloy
      if (din && din !== "N/D") mats.add(din)
      else if (alloy && alloy !== "N/D") mats.add(alloy)
    }
    return {
      thicknesses: Array.from(thicks).sort((a, b) => a - b),
      materials: Array.from(mats).sort(),
    }
  }, [project.rows])

  const nameById = useMemo(() => {
    const map: Record<string, string> = {}
    for (const r of project.rows) {
      map[r.id] = r.fileName
    }
    return map
  }, [project.rows])

  const collisionPairs = useMemo(() => {
    const pairs: { a: number; b: number; nameA: string; nameB: string }[] = []
    for (let i = 0; i < canvasPieces.length; i++) {
      for (let j = i + 1; j < canvasPieces.length; j++) {
        if (!piecesCollide(canvasPieces[i], canvasPieces[j])) continue
        const idA = canvasPieces[i].pieceId
        const idB = canvasPieces[j].pieceId
        pairs.push({
          a: i,
          b: j,
          nameA: nameById[idA] ?? idA,
          nameB: nameById[idB] ?? idB,
        })
      }
    }
    return pairs
  }, [canvasPieces, nameById])


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

    let wantDx = dx
    let wantDy = dy
    ;({ dx: wantDx, dy: wantDy } = constrainToMode(transformMode ?? "free", wantDx, wantDy))

    const prev = history.positionOverrides
    const nextPos = { ...prev }
    for (const idx of pieceIndices) {
      const cur = nextPos[idx] ?? { dx: 0, dy: 0 }
      nextPos[idx] = { dx: cur.dx + wantDx, dy: cur.dy + wantDy }
    }
    const n = pieceIndices.length
    history.commit(n === 1 ? "Mover pieza" : `Mover ${n} piezas`, {
      positionOverrides: nextPos,
      angleOverrides: history.angleOverrides,
    })
  }, [transformMode, history])

  const handleRotateSelected = useCallback((pieceIndices: number[], degrees: number) => {
    if (pieceIndices.length === 0 || Math.abs(degrees) < 1e-9) return
    const nextAng = { ...history.angleOverrides }
    for (const idx of pieceIndices) {
      const cur = nextAng[idx] ?? 0
      nextAng[idx] = ((cur + degrees) % 360 + 360) % 360
    }
    const sign = degrees >= 0 ? "+" : ""
    history.commit(`Rotar ${sign}${degrees}°`, {
      positionOverrides: history.positionOverrides,
      angleOverrides: nextAng,
    })
  }, [history])

  const handleAlign = useCallback((mode: "left" | "right" | "top" | "bottom" | "center-h" | "center-v") => {
    if (selectedPieceIndices.length < 2) return
    const refIndex = selectedPieceIndices[selectedPieceIndices.length - 1]
    const refPiece = canvasPieces[refIndex]
    if (!refPiece) return
    const refBounds = boundingRect(refPiece.outline)

    const prev = history.positionOverrides
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
    history.commit("Alinear piezas", {
      positionOverrides: next,
      angleOverrides: history.angleOverrides,
    })
  }, [selectedPieceIndices, canvasPieces, history])

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


  const selectedOverrideDx = selectedPieceIndices.length
    ? positionOverrides[selectedPieceIndices[selectedPieceIndices.length - 1]]?.dx ?? 0
    : 0
  const selectedOverrideDy = selectedPieceIndices.length
    ? positionOverrides[selectedPieceIndices[selectedPieceIndices.length - 1]]?.dy ?? 0
    : 0
  const selectedOverrideAngle = selectedPieceIndices.length
    ? angleOverrides[selectedPieceIndices[selectedPieceIndices.length - 1]] ?? 0
    : 0

  const handleOverrideChange = useCallback(
    (next: { dx: number; dy: number; angle: number }) => {
      if (selectedPieceIndices.length === 0) return
      const idx = selectedPieceIndices[selectedPieceIndices.length - 1]
      const nextPos = { ...history.positionOverrides, [idx]: { dx: next.dx, dy: next.dy } }
      const nextAng = { ...history.angleOverrides, [idx]: ((next.angle % 360) + 360) % 360 }
      history.commit("Editar posición", {
        positionOverrides: nextPos,
        angleOverrides: nextAng,
      })
    },
    [selectedPieceIndices, history]
  )

  const handleResetOverrides = useCallback(() => {
    if (selectedPieceIndices.length === 0) return
    const nextPos = { ...history.positionOverrides }
    const nextAng = { ...history.angleOverrides }
    for (const idx of selectedPieceIndices) {
      delete nextPos[idx]
      delete nextAng[idx]
    }
    history.commit("Restablecer posición", {
      positionOverrides: nextPos,
      angleOverrides: nextAng,
    })
  }, [selectedPieceIndices, history])

  const handleRotateAroundPivot = useCallback(
    (pieceIndices: number[], pivot: { x: number; y: number }, degrees: number) => {
      if (pieceIndices.length === 0 || Math.abs(degrees) < 1e-6) return
      const rad = (degrees * Math.PI) / 180
      const cos = Math.cos(rad)
      const sin = Math.sin(rad)
      const nextPos = { ...history.positionOverrides }
      const nextAng = { ...history.angleOverrides }
      for (const idx of pieceIndices) {
        if (lockedPieceIndices.includes(idx)) continue
        const piece = canvasPieces[idx]
        if (!piece) continue
        const b = boundingRect(piece.outline)
        const cx = b.x + b.width / 2
        const cy = b.y + b.height / 2
        const dx0 = cx - pivot.x
        const dy0 = cy - pivot.y
        const nx = pivot.x + dx0 * cos - dy0 * sin
        const ny = pivot.y + dx0 * sin + dy0 * cos
        const prev = nextPos[idx] ?? { dx: 0, dy: 0 }
        nextPos[idx] = {
          dx: prev.dx + (nx - cx),
          dy: prev.dy + (ny - cy),
        }
        nextAng[idx] = (((nextAng[idx] ?? 0) + degrees) % 360 + 360) % 360
      }
      history.commit("Rotar pivot", {
        positionOverrides: nextPos,
        angleOverrides: nextAng,
      })
    },
    [history, canvasPieces, lockedPieceIndices],
  )



  const handleDeleteSelected = useCallback(() => {
    if (selectedPieceIndices.length === 0 || !activeGroup) return
    setPendingDelete(true)
  }, [selectedPieceIndices, activeGroup])

  const confirmDeleteFromSheet = useCallback(() => {
    if (selectedPieceIndices.length === 0 || !activeGroup) return
    project.removePlacedPieces(activeGroup.startIndex, selectedPieceIndices)
    setSelectedPieceIndices([])
    setPendingDelete(false)
  }, [selectedPieceIndices, activeGroup, project])

  const confirmDeleteFromProject = useCallback(() => {
    if (selectedPieceIndices.length === 0 || !activeGroup) return
    const pieceIds = new Set(
      selectedPieceIndices
        .map((i) => canvasPieces[i]?.pieceId)
        .filter((id): id is string => Boolean(id)),
    )
    project.removePlacedPieces(activeGroup.startIndex, selectedPieceIndices)
    for (const id of pieceIds) {
      project.onRemove(id)
    }
    setSelectedPieceIndices([])
    setPendingDelete(false)
  }, [selectedPieceIndices, activeGroup, project, canvasPieces])

  deleteSelectedRef.current = handleDeleteSelected

  /** Desde el listado: ir al tab de la plancha que contiene la pieza y seleccionarla. */
  const handleLocateRow = useCallback(
    (row: { id: string }) => {
      const groups = project.sheetGroups
      for (let gi = 0; gi < groups.length; gi++) {
        const group = groups[gi]
        const idx = group.sheet.pieces.findIndex((p) => p.pieceId === row.id)
        if (idx >= 0) {
          // Un solo paso: tab + selección (el effect de activeGroupIndex
          // aplicará pendingSelectRef en vez de limpiar).
          if (gi === activeGroupIndex) {
            setSelectedPieceIndices([idx])
          } else {
            pendingSelectRef.current = [idx]
            setActiveGroupIndex(gi)
          }
          setActivePanel("inspector")
          return
        }
      }
      setPreviewRowId(row.id)
    },
    [project.sheetGroups, activeGroupIndex],
  )


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
      onLocateRow: handleLocateRow,
      onRotate: project.onRotate,
      onMirrorX: project.onMirrorX,
      onMirrorY: project.onMirrorY,
      onDuplicate: project.onDuplicate,
      nextColor: project.nextColor,
      highlightedIds,
    }),
    [project, highlightedIds,
      handleLocateRow,]
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
                  <MaterialPanel settings={project.settings} onChange={project.onSettingsChange} pieceMaterials={pieceMaterialsSummary} />
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
                    selectedPieceName={selectedPieceName}
                    selectedPieceIndex={
                      selectedPieceIndices.length
                        ? selectedPieceIndices[selectedPieceIndices.length - 1]
                        : null
                    }
                    espesor={project.settings.espesor}
                    material={project.settings.material}
                    overrideDx={selectedOverrideDx}
                    overrideDy={selectedOverrideDy}
                    overrideAngle={selectedOverrideAngle}
                    onOverrideChange={handleOverrideChange}
                    onResetOverrides={handleResetOverrides}
                    collisionPairs={collisionPairs}
                    onSelectPieceIndex={(idx) => setSelectedPieceIndices([idx])}
                    locked={
                      selectedPieceIndices.length > 0 &&
                      lockedPieceIndices.includes(
                        selectedPieceIndices[selectedPieceIndices.length - 1],
                      )
                    }
                    onToggleLock={() => {
                      if (selectedPieceIndices.length === 0) return
                      const idx = selectedPieceIndices[selectedPieceIndices.length - 1]
                      setLockedPieceIndices((prev) =>
                        prev.includes(idx) ? prev.filter((i) => i !== idx) : [...prev, idx],
                      )
                    }}
                    onCopyOffsets={() => {
                      offsetsClipboardRef.current = {
                        dx: selectedOverrideDx,
                        dy: selectedOverrideDy,
                        angle: selectedOverrideAngle,
                      }
                      setOffsetsClipboardVersion((v) => v + 1)
                    }}
                    onPasteOffsets={() => {
                      const clip = offsetsClipboardRef.current
                      if (!clip || selectedPieceIndices.length === 0) return
                      handleOverrideChange(clip)
                    }}
                    canPasteOffsets={offsetsClipboardVersion > 0 && !!offsetsClipboardRef.current}
                  >
                    {selectedCadRow && (
                      <div className="flex flex-col gap-1">
                        <div className="px-1 text-[10px] font-semibold uppercase tracking-wider text-neutral-500">
                          Editar en lista
                        </div>
                        <PieceListRow
                          row={selectedCadRow}
                          conflict={project.conflictIds.has(selectedCadRow.id)}
                          disabled={project.isRunning}
                          highlighted
                          onPreview={(row) => setPreviewRowId(row.id)}
                          onLocate={handleLocateRow}
                          onUpdateQuantity={project.onUpdateQuantity}
                          onDuplicate={project.onDuplicate}
                          onRemove={project.onRemove}
                        />
                      </div>
                    )}
                  </PropertiesPanel>
                </div>
              )}
            </div>
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
        onOpen={() => {
          setProjectDialogMode("open")
          setProjectDialogOpen(true)
        }}
        onSave={() => {
          setProjectDialogMode("save")
          setProjectDialogOpen(true)
        }}
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

      {project.sessionRestored && !dismissedRestoredBanner && (
        <div className="mx-4 mt-3 flex shrink-0 items-center justify-between gap-3 rounded-2xl bg-white/3 p-3 shadow-sm">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white/5 text-neutral-300">
              <Info className="h-4 w-4" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-medium text-white truncate">Trabajo restaurado</span>
              <span className="text-[11px] text-neutral-400 truncate">
                Recuperado del navegador
                {project.sessionSavedAt
                  ? ` · ${new Date(project.sessionSavedAt).toLocaleString()}`
                  : ""}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              className="inline-flex items-center gap-1.5 rounded-xl bg-white/5 px-3 py-1.5 text-xs font-medium text-neutral-300 transition-colors hover:bg-white/10 hover:text-white"
              onClick={() => {
                project.onDiscardSession()
                history.resetAll?.() ?? history.reset()
                setSelectedPieceIndices([])
                setActiveGroupIndex(0)
              }}
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Descartar</span>
            </button>
            <button
              type="button"
              className="inline-flex h-7 w-7 items-center justify-center rounded-xl text-neutral-400 transition-colors hover:bg-white/10 hover:text-white"
              onClick={() => setDismissedRestoredBanner(true)}
              title="Cerrar aviso"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

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
                lockedPieceIndices={lockedPieceIndices}
                onMovePieces={handleMovePieces}
                onRotateSelected={handleRotateSelected}
                onRotateAroundPivot={handleRotateAroundPivot}
                onDeleteSelected={() => handleDeleteSelected()}
                onDeleteFromProject={() => handleDeleteSelected()}
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
                  <button
                    type="button"
                    disabled={!history.canUndo}
                    onClick={() => history.undo()}
                    className="rounded-lg px-2 py-1 text-[11px] font-medium text-neutral-300 hover:bg-white/10 hover:text-white disabled:opacity-30"
                    title={history.canUndo ? "Deshacer (Ctrl+Z)" : "Nada que deshacer"}
                  >
                    ↶
                  </button>
                  <button
                    type="button"
                    disabled={!history.canRedo}
                    onClick={() => history.redo()}
                    className="rounded-lg px-2 py-1 text-[11px] font-medium text-neutral-300 hover:bg-white/10 hover:text-white disabled:opacity-30"
                    title={history.canRedo ? "Rehacer (Ctrl+Shift+Z)" : "Nada que rehacer"}
                  >
                    ↷
                  </button>
                  <div className="h-4 w-px bg-white/10" />
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

      <Dialog open={pendingDelete} onOpenChange={(open) => !open && setPendingDelete(false)}>
        <DialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-md rounded-2xl border-white/10 bg-neutral-900 p-5 text-white shadow-2xl">
          <DialogHeader>
            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-red-500/10 text-red-400">
              <Trash2 size={20} />
            </div>
            <DialogTitle className="text-lg font-bold text-white">Eliminar piezas</DialogTitle>
            <DialogDescription className="pt-2 text-sm leading-relaxed text-neutral-400">
              {selectedPieceIndices.length === 1
                ? "Elige cómo eliminar la pieza seleccionada."
                : `Elige cómo eliminar las ${selectedPieceIndices.length} piezas seleccionadas.`}
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4 flex flex-col gap-2">
            <button
              type="button"
              onClick={confirmDeleteFromSheet}
              className="flex w-full flex-col items-start rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-left transition hover:bg-white/10"
            >
              <span className="text-sm font-semibold text-neutral-100">Quitar de la plancha</span>
              <span className="text-[11px] text-neutral-500">
                Solo del layout nesteado. Sigue en el listado del proyecto.
              </span>
            </button>
            <button
              type="button"
              onClick={confirmDeleteFromProject}
              className="flex w-full flex-col items-start rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-left transition hover:bg-red-500/20"
            >
              <span className="text-sm font-semibold text-red-300">Eliminar del proyecto</span>
              <span className="text-[11px] text-red-300/70">
                De la plancha y del listado (BOM). No se puede deshacer fácilmente.
              </span>
            </button>
            <button
              type="button"
              onClick={() => setPendingDelete(false)}
              className="mt-1 w-full rounded-xl bg-white/5 px-4 py-2.5 text-sm font-medium text-neutral-400 transition hover:bg-white/10 hover:text-white"
            >
              Cancelar
            </button>
          </div>
        </DialogContent>
      </Dialog>

      <ProjectDialog
        open={projectDialogOpen}
        mode={projectDialogMode}
        onClose={() => setProjectDialogOpen(false)}
        suggestedName={
          project.settings.cliente
            ? `nesting-${project.settings.cliente}`
            : "proyecto-nesting"
        }
        onSaveToBackend={async (name, existingId) => {
          await project.onSaveProjectBackend(name, existingId)
        }}
        onSaveLocal={async (name) => {
          await project.onSaveProjectLocal(name)
        }}
        onOpenFromBackend={async (id) => {
          await project.onOpenProjectFromBackend(id)
          const idx = project.getActiveGroupIndexForSession()
          setActiveGroupIndex(idx)
          setSelectedPieceIndices([])
          const snap = project.getSheetEdits()[String(idx)]
          history.replace({
            positionOverrides: snap?.positionOverrides ?? {},
            angleOverrides: snap?.angleOverrides ?? {},
          })
          setLockedPieceIndices(snap?.lockedIndices ?? [])
        }}
        onOpenLocalFile={async (file) => {
          const err = await project.onOpenProjectFile(file)
          if (err) throw new Error(err)
          const idx = project.getActiveGroupIndexForSession()
          setActiveGroupIndex(idx)
          setSelectedPieceIndices([])
          const snap = project.getSheetEdits()[String(idx)]
          history.replace({
            positionOverrides: snap?.positionOverrides ?? {},
            angleOverrides: snap?.angleOverrides ?? {},
          })
          setLockedPieceIndices(snap?.lockedIndices ?? [])
        }}
      />

      <ExportDialog
        nameById={nameById}
        open={exportDialogOpen}
        onClose={() => setExportDialogOpen(false)}
        sheetGroups={project.sheetGroups}
        sheets={project.sheets}
        sheetConfig={project.sheetConfig}
        nomenclatura={project.nomenclatura}
        onExportSheet={handleExportSheet}
        onSaveProject={project.onSaveProject}
        cliente={project.settings.cliente}
        maquina={project.machine.maquina}
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