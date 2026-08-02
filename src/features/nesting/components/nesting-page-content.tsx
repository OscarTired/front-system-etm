"use client"

import { useMemo, useRef, useState } from "react"
import {
  Plus,
  Trash2,
  Loader2,
  X,
  Upload,
  FileWarning,
  Download,
  FolderOpen,
  Save,
  AlertTriangle,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useNesting } from "../hooks/use-nesting"
import type { NestingPiece, PieceOutline, SubEntity } from "../engine/types"
import { readCadFile, isSupportedCadFile } from "../cad/cad-reader"
import { scanMaterialData, isValidMaterialData, type MaterialData } from "../cad/thickness-scanner"
import { auditMaterials, type AuditablePiece } from "../cad/material-audit"
import { calculateSheetUsagePercent } from "../engine/sheet-usage"
import { buildPathsByColor, groupIdenticalSheets, formatSheetRangeLabel } from "../utils/svg-render"
import { buildPieceCatalog } from "../export/piece-catalog"
import { buildSheetFileName, type Nomenclatura } from "../export/nomenclatura"
import { generateSheetDxf } from "../export/dxf-export"
import { generateSheetNsp } from "../export/nsp-export"
import { serializeProject, parseProjectFile, ProjectFileParseError, type ProjectPieceEntry } from "../export/project-file"

interface ManualRow {
  id: string
  source: "manual"
  width: string
  height: string
  quantity: string
  color: string
}

interface CadRow {
  id: string
  source: "cad"
  fileName: string
  outline: PieceOutline
  subEntities: SubEntity[]
  width: number
  height: number
  quantity: string
  color: string
  material: MaterialData
}

type PieceRow = ManualRow | CadRow

const PIECE_COLORS = ["#22c55e", "#f97316", "#3b82f6", "#eab308", "#ec4899", "#a855f7"]

let colorCursor = 0
function nextColor(): string {
  const c = PIECE_COLORS[colorCursor % PIECE_COLORS.length]
  colorCursor++
  return c
}

function makeEmptyManualRow(): ManualRow {
  return {
    id: `pieza-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    source: "manual",
    width: "",
    height: "",
    quantity: "1",
    color: nextColor(),
  }
}

function rectOutline(w: number, h: number): PieceOutline {
  return {
    points: [
      { x: 0, y: 0 },
      { x: w, y: 0 },
      { x: w, y: h },
      { x: 0, y: h },
    ],
  }
}

function downloadTextFile(fileName: string, content: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = fileName
  a.click()
  URL.revokeObjectURL(url)
}

export function NestingPageContent() {
  const [rows, setRows] = useState<PieceRow[]>([makeEmptyManualRow()])
  const [sheetWidth, setSheetWidth] = useState("1000")
  const [sheetHeight, setSheetHeight] = useState("600")
  const [margin, setMargin] = useState("10")
  const [importError, setImportError] = useState<string | null>(null)
  const [showCatalog, setShowCatalog] = useState(false)

  const [nom, setNom] = useState<Nomenclatura>({
    anio: String(new Date().getFullYear()).slice(-2),
    proyecto: "",
    lote: "1",
    material: "",
    espesor: "",
  })

  const fileInputRef = useRef<HTMLInputElement>(null)
  const projectInputRef = useRef<HTMLInputElement>(null)
  const { status, progress, sheets, error, run, cancel } = useNesting()

  const isRunning = status === "running"

  const addManualRow = () => setRows((prev) => [...prev, makeEmptyManualRow()])

  const removeRow = (id: string) => {
    setRows((prev) => (prev.length > 1 ? prev.filter((r) => r.id !== id) : prev))
  }

  const updateManualRow = (id: string, patch: Partial<ManualRow>) => {
    setRows((prev) =>
      prev.map((r) => (r.id === id && r.source === "manual" ? { ...r, ...patch } : r))
    )
  }

  const updateQuantity = (id: string, quantity: string) => {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, quantity } : r)))
  }

  const handleImportClick = () => fileInputRef.current?.click()
  const handleOpenProjectClick = () => projectInputRef.current?.click()

  const handleFilesSelected = async (files: FileList | null) => {
    if (!files || files.length === 0) return
    setImportError(null)

    const newRows: CadRow[] = []
    const rejected: string[] = []

    for (const file of Array.from(files)) {
      if (!isSupportedCadFile(file.name)) {
        rejected.push(`${file.name} (formato no soportado, solo .dxf y .geo)`)
        continue
      }

      const text = await file.text()
      const cadData = readCadFile(file.name, text)

      if (!cadData.valid || cadData.outline.points.length === 0) {
        rejected.push(`${file.name} (no se pudo leer geometría válida)`)
        continue
      }

      newRows.push({
        id: `cad-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        source: "cad",
        fileName: file.name,
        outline: cadData.outline,
        subEntities: cadData.entities.map((e) => ({ outline: e.outline, color: e.color, layer: e.layer })),
        width: cadData.width,
        height: cadData.height,
        quantity: "1",
        color: nextColor(),
        material: scanMaterialData(file.name, text),
      })
    }

    if (rejected.length > 0) {
      setImportError(`No se pudieron importar: ${rejected.join(", ")}`)
    }

    if (newRows.length > 0) {
      setRows((prev) => {
        const onlyEmptyManual =
          prev.length === 1 && prev[0].source === "manual" && !prev[0].width && !prev[0].height
        return onlyEmptyManual ? newRows : [...prev, ...newRows]
      })
    }
  }

  const handleSaveProject = () => {
    const pieces: ProjectPieceEntry[] = rows.map((row) =>
      row.source === "manual"
        ? {
            id: row.id,
            source: "manual",
            width: Number(row.width) || 0,
            height: Number(row.height) || 0,
            quantity: Number(row.quantity) || 1,
            color: row.color,
            outline: rectOutline(Number(row.width) || 0, Number(row.height) || 0),
          }
        : {
            id: row.id,
            source: "cad",
            fileName: row.fileName,
            width: row.width,
            height: row.height,
            quantity: Number(row.quantity) || 1,
            color: row.color,
            outline: row.outline,
            subEntities: row.subEntities,
            material: row.material,
          }
    )

    const json = serializeProject({
      sheet: { width: Number(sheetWidth) || 0, height: Number(sheetHeight) || 0, margin: Number(margin) || 0 },
      pieces,
    })

    downloadTextFile(`nesting-proyecto-${Date.now()}.json`, json, "application/json")
  }

  const handleOpenProject = async (file: File | undefined) => {
    if (!file) return
    setImportError(null)

    try {
      const text = await file.text()
      const project = parseProjectFile(text)

      setSheetWidth(String(project.sheet.width))
      setSheetHeight(String(project.sheet.height))
      setMargin(String(project.sheet.margin))

      const loadedRows: PieceRow[] = project.pieces.map((p) =>
        p.source === "manual"
          ? {
              id: p.id,
              source: "manual",
              width: String(p.width),
              height: String(p.height),
              quantity: String(p.quantity),
              color: p.color,
            }
          : {
              id: p.id,
              source: "cad",
              fileName: p.fileName ?? "pieza.dxf",
              outline: p.outline,
              subEntities: p.subEntities ?? [],
              width: p.width,
              height: p.height,
              quantity: String(p.quantity),
              color: p.color,
              material: p.material ?? { thickness: -1, dinNorm: "N/D", alloy: "N/D" },
            }
      )

      setRows(loadedRows.length > 0 ? loadedRows : [makeEmptyManualRow()])
    } catch (err) {
      setImportError(
        err instanceof ProjectFileParseError
          ? `No se pudo abrir el proyecto: ${err.message}`
          : "No se pudo abrir el proyecto: archivo inválido."
      )
    }
  }

  const validPieces = useMemo<NestingPiece[]>(() => {
    const pieces: NestingPiece[] = []
    for (const row of rows) {
      const quantity = Number(row.quantity) || 1
      if (row.source === "manual") {
        const w = Number(row.width)
        const h = Number(row.height)
        if (w > 0 && h > 0) pieces.push({ id: row.id, outline: rectOutline(w, h), quantity, color: row.color })
      } else {
        pieces.push({ id: row.id, outline: row.outline, subEntities: row.subEntities, quantity, color: row.color })
      }
    }
    return pieces
  }, [rows])

  // Auditoría de materiales: solo tiene sentido entre piezas importadas de CAD real (las manuales no tienen material detectado).
  const materialAudit = useMemo(() => {
    const auditable: AuditablePiece[] = rows
      .filter((r): r is CadRow => r.source === "cad" && isValidMaterialData(r.material))
      .map((r) => ({ id: r.id, material: r.material }))
    return auditable.length > 1 ? auditMaterials(auditable) : null
  }, [rows])

  const conflictIds = useMemo(() => {
    if (!materialAudit) return new Set<string>()
    return new Set(materialAudit.results.filter((r) => r.hasConflict).map((r) => r.id))
  }, [materialAudit])

  const canRun = validPieces.length > 0 && !isRunning
  const sheetConfig = {
    width: Number(sheetWidth) || 1000,
    height: Number(sheetHeight) || 600,
    margin: Number(margin) || 0,
  }

  const handleRun = () => {
    if (!canRun) return
    run(validPieces, { sheet: sheetConfig })
  }

  const handleExportSheet = (format: "dxf" | "nsp", sheetIndex: number) => {
    if (!sheets) return
    const sheet = sheets[sheetIndex]
    const fileName = buildSheetFileName(nom, sheet.pieces.length, sheetIndex)
    if (format === "dxf") {
      downloadTextFile(`${fileName}.dxf`, generateSheetDxf(sheet, sheetConfig), "application/dxf")
    } else {
      downloadTextFile(`${fileName}.nsp`, generateSheetNsp(sheet, sheetConfig), "application/xml")
    }
  }

  const catalog = useMemo(() => (sheets ? buildPieceCatalog(sheets) : []), [sheets])

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4 tablet:flex-row">
      {/* Panel izquierdo: piezas + configuración */}
      <div className="flex w-full shrink-0 flex-col gap-4 tablet:w-[400px]">
        <section className="rounded-2xl border border-white/8 bg-white/[0.03] p-4">
          <h2 className="mb-3 text-sm font-semibold tracking-wide text-neutral-300">PLANCHA</h2>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="mb-1 block text-xs text-neutral-500">Ancho (mm)</label>
              <Input inputMode="decimal" value={sheetWidth} onChange={(e) => setSheetWidth(e.target.value)} />
            </div>
            <div>
              <label className="mb-1 block text-xs text-neutral-500">Alto (mm)</label>
              <Input inputMode="decimal" value={sheetHeight} onChange={(e) => setSheetHeight(e.target.value)} />
            </div>
            <div>
              <label className="mb-1 block text-xs text-neutral-500">Margen (mm)</label>
              <Input inputMode="decimal" value={margin} onChange={(e) => setMargin(e.target.value)} />
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-white/8 bg-white/[0.03] p-4">
          <h2 className="mb-3 text-sm font-semibold tracking-wide text-neutral-300">
            NOMENCLATURA <span className="font-normal text-neutral-600">(para exportar)</span>
          </h2>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="mb-1 block text-xs text-neutral-500">Año</label>
              <Input value={nom.anio} onChange={(e) => setNom((n) => ({ ...n, anio: e.target.value }))} />
            </div>
            <div>
              <label className="mb-1 block text-xs text-neutral-500">Proyecto</label>
              <Input value={nom.proyecto} onChange={(e) => setNom((n) => ({ ...n, proyecto: e.target.value }))} />
            </div>
            <div>
              <label className="mb-1 block text-xs text-neutral-500">Lote</label>
              <Input value={nom.lote} onChange={(e) => setNom((n) => ({ ...n, lote: e.target.value }))} />
            </div>
            <div>
              <label className="mb-1 block text-xs text-neutral-500">Material</label>
              <Input value={nom.material} onChange={(e) => setNom((n) => ({ ...n, material: e.target.value }))} />
            </div>
            <div className="col-span-2">
              <label className="mb-1 block text-xs text-neutral-500">Espesor</label>
              <Input value={nom.espesor} onChange={(e) => setNom((n) => ({ ...n, espesor: e.target.value }))} />
            </div>
          </div>
        </section>

        <section className="flex min-h-0 flex-1 flex-col rounded-2xl border border-white/8 bg-white/[0.03] p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold tracking-wide text-neutral-300">PIEZAS</h2>
            <div className="flex items-center gap-1">
              <Button size="icon-sm" variant="ghost" onClick={handleOpenProjectClick} disabled={isRunning} title="Abrir proyecto">
                <FolderOpen className="h-4 w-4" />
              </Button>
              <Button size="icon-sm" variant="ghost" onClick={handleSaveProject} disabled={isRunning} title="Guardar proyecto">
                <Save className="h-4 w-4" />
              </Button>
              <Button size="icon-sm" variant="ghost" onClick={handleImportClick} disabled={isRunning} title="Importar DXF/GEO">
                <Upload className="h-4 w-4" />
              </Button>
              <Button size="icon-sm" variant="ghost" onClick={addManualRow} disabled={isRunning} title="Agregar pieza manual">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept=".dxf,.geo"
            multiple
            className="hidden"
            onChange={(e) => {
              void handleFilesSelected(e.target.files)
              e.target.value = ""
            }}
          />
          <input
            ref={projectInputRef}
            type="file"
            accept=".json"
            className="hidden"
            onChange={(e) => {
              void handleOpenProject(e.target.files?.[0])
              e.target.value = ""
            }}
          />

          {importError && (
            <p className="mb-2 flex items-start gap-1.5 rounded-lg bg-destructive/10 p-2 text-xs text-destructive">
              <FileWarning className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              {importError}
            </p>
          )}

          {materialAudit && materialAudit.hasAnyConflict && (
            <p className="mb-2 flex items-start gap-1.5 rounded-lg bg-amber-500/10 p-2 text-xs text-amber-400">
              <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              Hay piezas con espesor/material distinto al resto del grupo (consenso: {materialAudit.targetThickness > 0 ? `${materialAudit.targetThickness}mm` : "N/D"}, {materialAudit.majorityDin}) — marcadas abajo.
            </p>
          )}

          <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto">
            {rows.map((row) => (
              <div
                key={row.id}
                className={`flex items-center gap-2 rounded-lg p-1 ${conflictIds.has(row.id) ? "bg-amber-500/10 ring-1 ring-amber-500/30" : ""}`}
              >
                {row.source === "cad" && <PieceThumbnail subEntities={row.subEntities} />}
                {row.source === "manual" && (
                  <span className="h-3 w-3 shrink-0 rounded-sm" style={{ backgroundColor: row.color }} aria-hidden />
                )}

                {row.source === "manual" ? (
                  <>
                    <Input
                      placeholder="Ancho"
                      inputMode="decimal"
                      value={row.width}
                      disabled={isRunning}
                      onChange={(e) => updateManualRow(row.id, { width: e.target.value })}
                      className="w-0 flex-1"
                    />
                    <span className="text-neutral-600">×</span>
                    <Input
                      placeholder="Alto"
                      inputMode="decimal"
                      value={row.height}
                      disabled={isRunning}
                      onChange={(e) => updateManualRow(row.id, { height: e.target.value })}
                      className="w-0 flex-1"
                    />
                  </>
                ) : (
                  <div className="w-0 flex-1 truncate" title={row.fileName}>
                    <div className="truncate text-sm text-neutral-300">{row.fileName}</div>
                    <div className="flex items-center gap-1.5 text-xs text-neutral-500">
                      <span>{row.width.toFixed(0)}×{row.height.toFixed(0)}</span>
                      {isValidMaterialData(row.material) && (
                        <span className="text-neutral-600">
                          · {row.material.thickness}mm
                          {row.material.dinNorm !== "N/D" && ` · ${row.material.dinNorm}`}
                        </span>
                      )}
                      {conflictIds.has(row.id) && <span className="text-amber-400">· conflicto material</span>}
                    </div>
                  </div>
                )}

                <Input
                  placeholder="Cant."
                  inputMode="numeric"
                  value={row.quantity}
                  disabled={isRunning}
                  onChange={(e) => updateQuantity(row.id, e.target.value)}
                  className="w-14 shrink-0"
                />
                <Button size="icon-sm" variant="ghost" disabled={isRunning || rows.length <= 1} onClick={() => removeRow(row.id)}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))}
          </div>
        </section>

        {!isRunning ? (
          <Button size="lg" disabled={!canRun} onClick={handleRun}>
            Nestear
          </Button>
        ) : (
          <div className="flex flex-col gap-2">
            <Button size="lg" variant="outline" onClick={cancel}>
              <X className="h-4 w-4" />
              Cancelar
            </Button>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
              <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${Math.round(progress * 100)}%` }} />
            </div>
            <p className="flex items-center justify-center gap-1.5 text-xs text-neutral-500">
              <Loader2 className="h-3 w-3 animate-spin" />
              Calculando… {Math.round(progress * 100)}%
            </p>
          </div>
        )}

        {error && <p className="rounded-lg bg-destructive/10 p-2 text-xs text-destructive">{error}</p>}
      </div>

      {/* Panel derecho: resultado */}
      <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-hidden">
        {sheets && sheets.length > 0 && (
          <div className="flex items-center justify-between rounded-xl border border-white/8 bg-white/[0.03] px-3 py-2">
            <p className="text-xs text-neutral-400">
              {sheets.length} plancha{sheets.length === 1 ? "" : "s"} · {catalog.length} pieza{catalog.length === 1 ? "" : "s"} únicas
            </p>
            <Button size="sm" variant="ghost" onClick={() => setShowCatalog((v) => !v)}>
              {showCatalog ? "Ocultar catálogo" : "Ver catálogo (BOM)"}
            </Button>
          </div>
        )}

        {showCatalog && catalog.length > 0 && (
          <div className="rounded-xl border border-white/8 bg-white/[0.03] p-3">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-left text-neutral-500">
                  <th className="pb-1.5 font-medium">Pieza</th>
                  <th className="pb-1.5 font-medium">Dimensiones</th>
                  <th className="pb-1.5 font-medium">Perímetro</th>
                  <th className="pb-1.5 text-right font-medium">Cantidad</th>
                </tr>
              </thead>
              <tbody className="text-neutral-300">
                {catalog.map((c) => (
                  <tr key={c.uid} className="border-t border-white/5">
                    <td className="py-1.5">{c.pieceId}</td>
                    <td className="py-1.5">{c.width.toFixed(0)}×{c.height.toFixed(0)}mm</td>
                    <td className="py-1.5">{c.perimeter.toFixed(0)}mm</td>
                    <td className="py-1.5 text-right font-medium">{c.quantity}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="min-h-0 flex-1 overflow-auto rounded-2xl border border-white/8 bg-white/[0.02] p-4">
          {!sheets && (
            <div className="flex h-full items-center justify-center text-sm text-neutral-600">
              Agrega piezas (manual o importando .dxf/.geo) y presiona Nestear para ver el resultado acá.
            </div>
          )}

          {sheets && sheets.length === 0 && (
            <div className="flex h-full items-center justify-center text-sm text-neutral-600">
              No se pudo acomodar ninguna pieza.
            </div>
          )}

          {sheets && sheets.length > 0 && (
            <div className="flex flex-wrap gap-6">
              {groupIdenticalSheets(sheets).map((group) => (
                <NestingSheetSvg
                  key={group.startIndex}
                  label={formatSheetRangeLabel(group)}
                  count={group.count}
                  sheetWidth={sheetConfig.width}
                  sheetHeight={sheetConfig.height}
                  pieces={group.sheet.pieces}
                  usagePercent={calculateSheetUsagePercent(group.sheet, sheetConfig)}
                  onExport={(format) => handleExportSheet(format, group.startIndex)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function PieceThumbnail({ subEntities }: { subEntities: SubEntity[] }) {
  const allPoints = subEntities.flatMap((e) => e.outline.points)
  if (allPoints.length === 0) return <div className="h-8 w-8 shrink-0" />

  let minX = allPoints[0].x, maxX = allPoints[0].x
  let minY = allPoints[0].y, maxY = allPoints[0].y
  for (const p of allPoints) {
    if (p.x < minX) minX = p.x
    if (p.x > maxX) maxX = p.x
    if (p.y < minY) minY = p.y
    if (p.y > maxY) maxY = p.y
  }
  const w = Math.max(maxX - minX, 1)
  const h = Math.max(maxY - minY, 1)
  const pad = Math.max(w, h) * 0.05

  return (
    <svg
      width={32}
      height={32}
      viewBox={`${minX - pad} ${minY - pad} ${w + pad * 2} ${h + pad * 2}`}
      className="h-8 w-8 shrink-0 rounded-md bg-black/40"
    >
      {Array.from(buildPathsByColor(subEntities)).map(([color, d]) => (
        <path key={color} d={d} fill="none" stroke={color} strokeWidth={Math.max(w, h) / 60} />
      ))}
    </svg>
  )
}

function NestingSheetSvg({
  label,
  count,
  sheetWidth,
  sheetHeight,
  pieces,
  usagePercent,
  onExport,
}: {
  label: string
  count: number
  sheetWidth: number
  sheetHeight: number
  pieces: import("../engine/types").PlacedPiece[]
  usagePercent: number
  onExport: (format: "dxf" | "nsp") => void
}) {
  const maxDisplayWidth = 460
  const scale = maxDisplayWidth / sheetWidth
  const usageColor = usagePercent >= 70 ? "text-emerald-400" : usagePercent >= 40 ? "text-amber-400" : "text-neutral-400"

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-medium text-neutral-400">
          {label} {count > 1 && <span className="text-neutral-500">· {count} idénticas</span>} · {pieces.length} pieza{pieces.length === 1 ? "" : "s"}
          {" · "}
          <span className={usageColor}>{usagePercent.toFixed(1)}% uso</span>
        </p>
        <div className="flex gap-1">
          <Button size="icon-sm" variant="ghost" title="Exportar DXF" onClick={() => onExport("dxf")}>
            <Download className="h-3.5 w-3.5" />
          </Button>
          <Button size="icon-sm" variant="ghost" title="Exportar NSP" onClick={() => onExport("nsp")}>
            <Download className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
      <svg
        width={sheetWidth * scale}
        height={sheetHeight * scale}
        viewBox={`0 0 ${sheetWidth} ${sheetHeight}`}
        className="rounded-lg border border-white/10 bg-black/40"
      >
        {pieces.map((piece, i) =>
          piece.subEntities && piece.subEntities.length > 0 ? (
            <g key={i}>
              {Array.from(buildPathsByColor(piece.subEntities)).map(([color, d]) => (
                <path key={color} d={d} fill="none" stroke={color} strokeWidth={0.6} />
              ))}
            </g>
          ) : (
            <polygon
              key={i}
              points={piece.outline.points.map((p) => `${p.x},${p.y}`).join(" ")}
              fill={piece.color ?? "#22c55e"}
              fillOpacity={0.35}
              stroke={piece.color ?? "#22c55e"}
              strokeWidth={1.5}
            />
          )
        )}
      </svg>
    </div>
  )
}
