"use client"

import { useCallback, useEffect, useState } from "react"
import { Download, RefreshCw, Boxes } from "lucide-react"
import { useRouter } from "next/navigation"

import { cn } from "@/shared/utils/utils"
import { toast } from "sonner"
import { cadPieceApi } from "../api/cad-piece.api"
import type { CreateTiraBody, GeometryModel } from "../types/geometry-model"
import { GeometrySvgPreview } from "./geometry-svg-preview"
import { enqueuePendingNestingPieces } from "../pending-nesting-pieces"
import { nestingPieceToCadRow } from "../utils/nesting-piece-to-cad-row"

const DEFAULT: CreateTiraBody = {
  length: 211.25,
  width: 13.6,
  endRadius: 6.8,
  holes: { diameter: 4, insetFromEnd: 8, countPerEnd: 1 },
  bends: { positions: [20.16, 51.97, 159.28, 191.1] },
  thicknessMm: 1.5,
  name: "tira",
}

function num(v: string, fallback: number) {
  const n = Number(v)
  return Number.isFinite(n) ? n : fallback
}

function Field({
  label,
  value,
  onChange,
  step = "0.1",
}: {
  label: string
  value: string
  onChange: (v: string) => void
  step?: string
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      <input
        type="number"
        step={step}
        value={value}
        onChange={e => onChange(e.target.value)}
        className="h-9 rounded-xl border border-border bg-foreground/5 px-3 text-sm tabular-nums outline-none focus:border-foreground/30"
      />
    </label>
  )
}

export function TiraGeneratorPanel() {
  const router = useRouter()
  const [length, setLength] = useState(String(DEFAULT.length))
  const [width, setWidth] = useState(String(DEFAULT.width))
  const [endRadius, setEndRadius] = useState(String(DEFAULT.endRadius ?? 0))
  const [diameter, setDiameter] = useState(
    String(DEFAULT.holes?.diameter ?? 4),
  )
  const [inset, setInset] = useState(
    String(DEFAULT.holes?.insetFromEnd ?? 8),
  )
  const [bendStr, setBendStr] = useState(
    (DEFAULT.bends?.positions ?? []).join(", "),
  )
  const [withHoles, setWithHoles] = useState(true)
  const [withBends, setWithBends] = useState(true)

  const [model, setModel] = useState<GeometryModel | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const body = useCallback((): CreateTiraBody => {
    const b: CreateTiraBody = {
      length: num(length, DEFAULT.length),
      width: num(width, DEFAULT.width),
      endRadius: num(endRadius, 0),
      thicknessMm: DEFAULT.thicknessMm,
      name: "tira",
    }
    if (withHoles) {
      b.holes = {
        diameter: num(diameter, 4),
        insetFromEnd: num(inset, 8),
        countPerEnd: 1,
      }
    }
    if (withBends) {
      const positions = bendStr
        .split(/[,;\s]+/)
        .map(s => Number(s.trim()))
        .filter(n => Number.isFinite(n) && n > 0)
      if (positions.length) b.bends = { positions }
    }
    return b
  }, [length, width, endRadius, diameter, inset, bendStr, withHoles, withBends])

  const generate = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const m = await cadPieceApi.generate(body())
      setModel(m)
    } catch (err) {
      setModel(null)
      setError(
        err instanceof Error ? err.message : "No se pudo generar la tira",
      )
    } finally {
      setLoading(false)
    }
  }, [body])

  useEffect(() => {
    void generate()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const onDownloadDxf = async () => {
    try {
      const blob = await cadPieceApi.downloadDxf(body())
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `tira-${body().length}x${body().width}.dxf`
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      /* toast api-client */
    }
  }

  const onSendToNesting = async () => {
    try {
      const piece = await cadPieceApi.asNestingPiece(body())
      const row = nestingPieceToCadRow(
        piece,
        `tira-${body().length}x${body().width}.dxf`,
      )
      enqueuePendingNestingPieces([row])
      toast.success("Pieza lista — abriendo Nesting")
      router.push("/nesting")
    } catch {
      /* toast */
    }
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4 desktop:flex-row">
      <div className="flex w-full shrink-0 flex-col gap-3 desktop:w-72">
        <p className="text-xs text-muted-foreground">
          Plantilla <span className="font-semibold text-foreground">Tira</span>
          · cotas en mm · preview desde backend
        </p>
        <div className="grid grid-cols-2 gap-2">
          <Field label="Largo" value={length} onChange={setLength} />
          <Field label="Ancho" value={width} onChange={setWidth} />
          <Field label="Radio extremo" value={endRadius} onChange={setEndRadius} />
        </div>

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={withHoles}
            onChange={e => setWithHoles(e.target.checked)}
            className="size-4 rounded"
          />
          Agujeros en extremos
        </label>
        {withHoles && (
          <div className="grid grid-cols-2 gap-2">
            <Field label="Diámetro" value={diameter} onChange={setDiameter} />
            <Field label="Inset extremo" value={inset} onChange={setInset} />
          </div>
        )}

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={withBends}
            onChange={e => setWithBends(e.target.checked)}
            className="size-4 rounded"
          />
          Dobleces (X separados por coma)
        </label>
        {withBends && (
          <input
            type="text"
            value={bendStr}
            onChange={e => setBendStr(e.target.value)}
            className="h-9 rounded-xl border border-border bg-foreground/5 px-3 text-sm tabular-nums outline-none focus:border-foreground/30"
            placeholder="20.16, 51.97, …"
          />
        )}

        <div className="flex flex-wrap gap-2 pt-1">
          <button
            type="button"
            onClick={() => void generate()}
            disabled={loading}
            className={cn(
              "inline-flex h-9 items-center gap-1.5 rounded-xl bg-foreground/10 px-3 text-sm font-medium transition hover:bg-foreground/15",
              loading && "opacity-60",
            )}
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            Generar
          </button>
          <button
            type="button"
            onClick={() => void onDownloadDxf()}
            className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-foreground/10 px-3 text-sm font-medium transition hover:bg-foreground/15"
          >
            <Download size={14} />
            DXF
          </button>
          <button
            type="button"
            onClick={() => void onSendToNesting()}
            className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-primary px-3 text-sm font-medium text-primary-foreground transition hover:opacity-90"
          >
            <Boxes size={14} />
            Nesting
          </button>
        </div>
        {error && (
          <p className="text-xs text-destructive">{error}</p>
        )}
      </div>

      <div className="min-h-0 min-w-0 flex-1 rounded-2xl border border-border bg-foreground/[0.03] p-2">
        <GeometrySvgPreview model={model} className="h-full min-h-[240px]" />
      </div>
    </div>
  )
}
