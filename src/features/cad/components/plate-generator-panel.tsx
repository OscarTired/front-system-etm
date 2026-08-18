"use client"

import { useCallback, useEffect, useState } from "react"
import { Download, RefreshCw, Boxes } from "lucide-react"
import { useRouter } from "next/navigation"

import { cn } from "@/shared/utils/utils"
import { toast } from "sonner"
import { cadPlateApi } from "../api/cad-plate.api"
import type { CreatePlateBody, GeometryModel } from "../types/geometry-model"
import { GeometrySvgPreview } from "./geometry-svg-preview"
import { enqueuePendingNestingPieces } from "../pending-nesting-pieces"
import { nestingPieceToCadRow } from "../utils/nesting-piece-to-cad-row"

const DEFAULT: CreatePlateBody = {
  width: 400,
  height: 300,
  holes: { diameter: 20, offset: 50 },
}

function num(v: string, fallback: number) {
  const n = Number(v)
  return Number.isFinite(n) ? n : fallback
}

export function PlateGeneratorPanel() {
  const router = useRouter()
  const [width, setWidth] = useState(String(DEFAULT.width))
  const [height, setHeight] = useState(String(DEFAULT.height))
  const [diameter, setDiameter] = useState(String(DEFAULT.holes!.diameter))
  const [offset, setOffset] = useState(String(DEFAULT.holes!.offset))
  const [withHoles, setWithHoles] = useState(true)

  const [model, setModel] = useState<GeometryModel | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const body = useCallback((): CreatePlateBody => {
    const b: CreatePlateBody = {
      width: num(width, DEFAULT.width),
      height: num(height, DEFAULT.height),
    }
    if (withHoles) {
      b.holes = {
        diameter: num(diameter, DEFAULT.holes!.diameter),
        offset: num(offset, DEFAULT.holes!.offset),
      }
    }
    return b
  }, [width, height, diameter, offset, withHoles])

  const generate = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const m = await cadPlateApi.generate(body())
      setModel(m)
    } catch (err) {
      setModel(null)
      setError(
        err instanceof Error ? err.message : "No se pudo generar la placa",
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
      const blob = await cadPlateApi.downloadDxf(body())
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `plate-${body().width}x${body().height}.dxf`
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      // toast global del api-client
    }
  }


  const onSendToNesting = async () => {
    try {
      const piece = await cadPlateApi.asNestingPiece(body())
      const row = nestingPieceToCadRow(
        piece,
        `placa-${body().width}x${body().height}.dxf`,
      )
      enqueuePendingNestingPieces([row])
      toast.success("Pieza lista — abriendo Nesting")
      router.push("/nesting")
    } catch (err) {
      const msg =
        err && typeof err === "object" && "response" in err
          ? String(
              (err as { response?: { data?: { message?: string } } }).response
                ?.data?.message ?? "No se pudo enviar a Nesting",
            )
          : err instanceof Error
            ? err.message
            : "No se pudo enviar a Nesting"
      toast.error(msg)
    }
  }

  const fieldClass =
    "h-9 w-full rounded-lg bg-foreground/5 px-3 text-sm text-foreground outline-none ring-0 placeholder:text-muted-foreground focus:bg-foreground/10"

  return (
    <div className="flex h-full min-h-0 flex-col gap-3 tablet:flex-row">
      <aside className="flex w-full shrink-0 flex-col gap-3 rounded-xl bg-foreground/5 p-3 tablet:w-56 desktop:w-64">
        <p className="text-xs font-medium tracking-wide text-muted-foreground">
          PARÁMETROS
        </p>

        <label className="flex flex-col gap-1">
          <span className="text-xs text-muted-foreground">Ancho (mm)</span>
          <input
            type="number"
            min={1}
            value={width}
            onChange={e => setWidth(e.target.value)}
            className={fieldClass}
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-xs text-muted-foreground">Alto (mm)</span>
          <input
            type="number"
            min={1}
            value={height}
            onChange={e => setHeight(e.target.value)}
            className={fieldClass}
          />
        </label>

        <label className="flex items-center gap-2 text-sm text-foreground">
          <input
            type="checkbox"
            checked={withHoles}
            onChange={e => setWithHoles(e.target.checked)}
            className="size-4 rounded border-0"
          />
          Agujeros en esquinas
        </label>

        {withHoles && (
          <>
            <label className="flex flex-col gap-1">
              <span className="text-xs text-muted-foreground">Ø agujero (mm)</span>
              <input
                type="number"
                min={0.1}
                value={diameter}
                onChange={e => setDiameter(e.target.value)}
                className={fieldClass}
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs text-muted-foreground">Offset (mm)</span>
              <input
                type="number"
                min={0}
                value={offset}
                onChange={e => setOffset(e.target.value)}
                className={fieldClass}
              />
            </label>
          </>
        )}

        <div className="mt-auto flex flex-col gap-2 pt-2">
          <button
            type="button"
            onClick={() => void generate()}
            disabled={loading}
            className={cn(
              "flex h-9 items-center justify-center gap-2 rounded-lg bg-foreground/10 text-sm font-medium text-foreground transition",
              "hover:bg-foreground/15 disabled:opacity-50",
            )}
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            Generar
          </button>
          <button
            type="button"
            onClick={() => void onDownloadDxf()}
            disabled={!model || loading}
            className={cn(
              "flex h-9 items-center justify-center gap-2 rounded-lg bg-foreground/10 text-sm font-medium text-foreground transition",
              "hover:bg-foreground/15 disabled:opacity-50",
            )}
          >
            <Download size={14} />
            Exportar DXF
          </button>
          <button
            type="button"
            onClick={() => void onSendToNesting()}
            disabled={!model || loading}
            className={cn(
              "flex h-9 items-center justify-center gap-2 rounded-lg bg-foreground/10 text-sm font-medium text-foreground transition",
              "hover:bg-foreground/15 disabled:opacity-50",
            )}
          >
            <Boxes size={14} />
            Enviar a Nesting
          </button>
        </div>

        {error && <p className="text-xs text-red-400">{error}</p>}
        {model && (
          <p className="text-[11px] text-muted-foreground">
            {model.entities.length} entidades · {model.units}
          </p>
        )}
      </aside>

      <div className="min-h-0 min-w-0 flex-1">
        <GeometrySvgPreview model={model} className="h-full min-h-[280px]" />
      </div>
    </div>
  )
}
