"use client"

import { useMemo, useRef, useState } from "react"
import { Plus, Trash2, Loader2, X, Upload, FileWarning } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useNesting } from "../hooks/use-nesting"
import type { NestingPiece, PieceOutline } from "../engine/types"
import { readCadFile, isSupportedCadFile } from "../cad/cad-reader"

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
  subOutlines: PieceOutline[]
  width: number
  height: number
  quantity: string
  color: string
}

type PieceRow = ManualRow | CadRow

const PIECE_COLORS = [
  "#22c55e", // verde
  "#f97316", // naranja
  "#3b82f6", // azul
  "#eab308", // amarillo
  "#ec4899", // rosa
  "#a855f7", // violeta
]

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

export function NestingPageContent() {
  const [rows, setRows] = useState<PieceRow[]>([makeEmptyManualRow()])
  const [sheetWidth, setSheetWidth] = useState("1000")
  const [sheetHeight, setSheetHeight] = useState("600")
  const [margin, setMargin] = useState("10")
  const [importError, setImportError] = useState<string | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const { status, progress, sheets, error, run, cancel } = useNesting()

  const isRunning = status === "running"

  const addManualRow = () => {
    setRows((prev) => [...prev, makeEmptyManualRow()])
  }

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

  const handleImportClick = () => {
    fileInputRef.current?.click()
  }

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
        subOutlines: cadData.entities.map((e) => e.outline),
        width: cadData.width,
        height: cadData.height,
        quantity: "1",
        color: nextColor(),
      })
    }

    if (rejected.length > 0) {
      setImportError(`No se pudieron importar: ${rejected.join(", ")}`)
    }

    if (newRows.length > 0) {
      setRows((prev) => {
        // Si solo hay una fila manual vacía sin usar, la reemplazamos en vez de acumular.
        const onlyEmptyManual =
          prev.length === 1 && prev[0].source === "manual" && !prev[0].width && !prev[0].height
        return onlyEmptyManual ? newRows : [...prev, ...newRows]
      })
    }
  }

  const validPieces = useMemo<NestingPiece[]>(() => {
    const pieces: NestingPiece[] = []

    for (const row of rows) {
      const quantity = Number(row.quantity) || 1

      if (row.source === "manual") {
        const w = Number(row.width)
        const h = Number(row.height)
        if (w > 0 && h > 0) {
          pieces.push({ id: row.id, outline: rectOutline(w, h), quantity, color: row.color })
        }
      } else {
        pieces.push({
          id: row.id,
          outline: row.outline,
          subOutlines: row.subOutlines,
          quantity,
          color: row.color,
        })
      }
    }

    return pieces
  }, [rows])

  const canRun = validPieces.length > 0 && !isRunning

  const handleRun = () => {
    if (!canRun) return
    run(validPieces, {
      sheet: {
        width: Number(sheetWidth) || 1000,
        height: Number(sheetHeight) || 600,
        margin: Number(margin) || 0,
      },
    })
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4 tablet:flex-row">
      {/* Panel izquierdo: piezas + configuración */}
      <div className="flex w-full shrink-0 flex-col gap-4 tablet:w-[380px]">
        <section className="rounded-2xl border border-white/8 bg-white/[0.03] p-4">
          <h2 className="mb-3 text-sm font-semibold tracking-wide text-neutral-300">
            PLANCHA
          </h2>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="mb-1 block text-xs text-neutral-500">Ancho (mm)</label>
              <Input
                inputMode="decimal"
                value={sheetWidth}
                onChange={(e) => setSheetWidth(e.target.value)}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-neutral-500">Alto (mm)</label>
              <Input
                inputMode="decimal"
                value={sheetHeight}
                onChange={(e) => setSheetHeight(e.target.value)}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-neutral-500">Margen (mm)</label>
              <Input
                inputMode="decimal"
                value={margin}
                onChange={(e) => setMargin(e.target.value)}
              />
            </div>
          </div>
        </section>

        <section className="flex min-h-0 flex-1 flex-col rounded-2xl border border-white/8 bg-white/[0.03] p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold tracking-wide text-neutral-300">
              PIEZAS
            </h2>
            <div className="flex items-center gap-1">
              <Button size="icon-sm" variant="ghost" onClick={handleImportClick} disabled={isRunning}>
                <Upload className="h-4 w-4" />
              </Button>
              <Button size="icon-sm" variant="ghost" onClick={addManualRow} disabled={isRunning}>
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

          {importError && (
            <p className="mb-2 flex items-start gap-1.5 rounded-lg bg-destructive/10 p-2 text-xs text-destructive">
              <FileWarning className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              {importError}
            </p>
          )}

          <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto">
            {rows.map((row) => (
              <div key={row.id} className="flex items-center gap-2">
                <span
                  className="h-3 w-3 shrink-0 rounded-sm"
                  style={{ backgroundColor: row.color }}
                  aria-hidden
                />

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
                  <div className="w-0 flex-1 truncate text-sm text-neutral-300" title={row.fileName}>
                    {row.fileName}
                    <span className="ml-1.5 text-xs text-neutral-500">
                      {row.width.toFixed(0)}×{row.height.toFixed(0)}
                    </span>
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
                <Button
                  size="icon-sm"
                  variant="ghost"
                  disabled={isRunning || rows.length <= 1}
                  onClick={() => removeRow(row.id)}
                >
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
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{ width: `${Math.round(progress * 100)}%` }}
              />
            </div>
            <p className="flex items-center justify-center gap-1.5 text-xs text-neutral-500">
              <Loader2 className="h-3 w-3 animate-spin" />
              Calculando… {Math.round(progress * 100)}%
            </p>
          </div>
        )}

        {error && (
          <p className="rounded-lg bg-destructive/10 p-2 text-xs text-destructive">
            {error}
          </p>
        )}
      </div>

      {/* Panel derecho: resultado */}
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
            {sheets.map((sheet, i) => (
              <NestingSheetSvg
                key={i}
                index={i}
                sheetWidth={Number(sheetWidth) || 1000}
                sheetHeight={Number(sheetHeight) || 600}
                pieces={sheet.pieces}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function NestingSheetSvg({
  index,
  sheetWidth,
  sheetHeight,
  pieces,
}: {
  index: number
  sheetWidth: number
  sheetHeight: number
  pieces: import("../engine/types").PlacedPiece[]
}) {
  const maxDisplayWidth = 480
  const scale = maxDisplayWidth / sheetWidth

  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs font-medium text-neutral-400">
        Plancha #{index + 1} · {pieces.length} pieza{pieces.length === 1 ? "" : "s"}
      </p>
      <svg
        width={sheetWidth * scale}
        height={sheetHeight * scale}
        viewBox={`0 0 ${sheetWidth} ${sheetHeight}`}
        className="rounded-lg border border-white/10 bg-black/40"
      >
        {pieces.map((piece, i) =>
          piece.subOutlines && piece.subOutlines.length > 0 ? (
            <g key={i}>
              {piece.subOutlines.map((sub, j) => (
                <polyline
                  key={j}
                  points={sub.points.map((p) => `${p.x},${p.y}`).join(" ")}
                  fill="none"
                  stroke={piece.color ?? "#22c55e"}
                  strokeWidth={0.6}
                />
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
