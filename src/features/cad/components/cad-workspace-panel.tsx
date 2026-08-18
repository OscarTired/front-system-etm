"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import {
  Boxes,
  Download,
  RefreshCw,
  Save,
  Trash2,
  FileCode2,
} from "lucide-react"
import { useRouter } from "next/navigation"

import { cn } from "@/shared/utils/utils"
import { toast } from "sonner"
import { cadPieceApi } from "../api/cad-piece.api"
import type {
  CadTemplate,
  CreatePieceBody,
  GeometryModel,
} from "../types/geometry-model"
import { enqueuePendingNestingPieces } from "../pending-nesting-pieces"
import { nestingPieceToCadRow } from "../utils/nesting-piece-to-cad-row"
import {
  listCadTemplates,
  removeCadTemplate,
  saveCadTemplate,
  type SavedCadTemplate,
} from "../lib/cad-templates-storage"
import { dslToPiece, pieceToDsl } from "../lib/cad-spec-dsl"
import { geometryModelToCanvasPieces } from "../utils/geometry-to-canvas-pieces"
import dynamic from "next/dynamic"

const DxfCanvas = dynamic(
  () =>
    import("@/features/nesting/components/dxf-canvas/dxf-canvas").then(
      m => m.DxfCanvas,
    ),
  { ssr: false },
)

const TEMPLATES: { key: CadTemplate; label: string }[] = [
  { key: "tira", label: "Tira" },
  { key: "malla", label: "Malla" },
  { key: "plate", label: "Placa" },
]

const DEFAULT_TIRA: CreatePieceBody = {
  template: "tira",
  length: 211.25,
  width: 13.6,
  endRadius: 3,
  holes: { diameter: 4, insetFromEnd: 8, countPerEnd: 1 },
  bends: { positions: [20.16, 51.97, 159.28, 191.1] },
  thicknessMm: 1.5,
  material: "St37",
  name: "tira",
}

const DEFAULT_MALLA: CreatePieceBody = {
  template: "malla",
  width: 320,
  height: 220,
  margin: 12,
  cols: 8,
  rows: 6,
  holeWidth: 28,
  holeHeight: 22,
  thicknessMm: 1.5,
  material: "AlMg3",
  name: "malla",
}

const DEFAULT_PLATE: CreatePieceBody = {
  template: "plate",
  width: 400,
  height: 300,
  holes: { diameter: 20, offset: 50 },
  thicknessMm: 2,
  material: "St37",
  name: "placa",
}

function num(v: string, fb: number) {
  const n = Number(v)
  return Number.isFinite(n) ? n : fb
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
      <span className="text-[11px] font-medium tracking-wide text-muted-foreground">
        {label}
      </span>
      <input
        type="number"
        step={step}
        value={value}
        onChange={e => onChange(e.target.value)}
        className="h-9 w-full rounded-lg bg-foreground/5 px-3 text-sm tabular-nums text-foreground outline-none ring-0 border-0 focus:bg-foreground/10"
      />
    </label>
  )
}

export function CadWorkspacePanel() {
  const router = useRouter()
  const [mode, setMode] = useState<CadTemplate>("tira")
  const [body, setBody] = useState<CreatePieceBody>(DEFAULT_TIRA)
  const [model, setModel] = useState<GeometryModel | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [dsl, setDsl] = useState(() => pieceToDsl(DEFAULT_TIRA))
  const [showDsl, setShowDsl] = useState(false)
  const [saved, setSaved] = useState<SavedCadTemplate[]>([])
  const [saveName, setSaveName] = useState("")

  const refreshSaved = useCallback(() => {
    setSaved(listCadTemplates())
  }, [])

  useEffect(() => {
    refreshSaved()
  }, [refreshSaved])

  const switchMode = (m: CadTemplate) => {
    setMode(m)
    const next =
      m === "malla" ? DEFAULT_MALLA : m === "plate" ? DEFAULT_PLATE : DEFAULT_TIRA
    setBody(next)
    setDsl(pieceToDsl(next))
    setError(null)
  }

  const applyBody = (next: CreatePieceBody) => {
    setBody(next)
    setDsl(pieceToDsl(next))
  }

  const generate = useCallback(async (payload?: CreatePieceBody) => {
    const b = payload ?? body
    setLoading(true)
    setError(null)
    try {
      const m = await cadPieceApi.generate(b)
      setModel(m)
    } catch (err) {
      setModel(null)
      setError(err instanceof Error ? err.message : "No se pudo generar")
    } finally {
      setLoading(false)
    }
  }, [body])

  useEffect(() => {
    void generate(body)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode])

  const onDownloadDxf = async () => {
    try {
      const blob = await cadPieceApi.downloadDxf(body)
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      const tag =
        body.template === "malla"
          ? `${(body as { width: number }).width}x${(body as { height: number }).height}`
          : body.template === "plate"
            ? `${(body as { width: number }).width}x${(body as { height: number }).height}`
            : `${(body as { length: number }).length}x${(body as { width: number }).width}`
      a.download = `${body.template ?? "tira"}-${tag}.dxf`
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      /* api toast */
    }
  }

  const onSendToNesting = async () => {
    try {
      const piece = await cadPieceApi.asNestingPiece(body)
      const row = nestingPieceToCadRow(
        piece,
        `${body.name ?? body.template ?? "piece"}.dxf`,
      )
      enqueuePendingNestingPieces([row])
      toast.success("Pieza lista — abriendo Nesting")
      router.push("/nesting")
    } catch {
      /* api toast */
    }
  }

  const onSaveTemplate = () => {
    const entry = saveCadTemplate(saveName || body.name || mode, mode, body)
    setSaveName("")
    refreshSaved()
    toast.success(`Plantilla “${entry.name}” guardada`)
  }

  const onApplyDsl = () => {
    try {
      const next = dslToPiece(dsl)
      const t = next.template ?? "tira"
      setMode(t)
      applyBody(next)
      void generate(next)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "DSL inválido")
    }
  }

  const tira = mode === "tira"
  const malla = mode === "malla"
  const plate = mode === "plate"

  return (
    <div className="flex h-full min-h-0 flex-col gap-3">
      {/* Toolbar */}
      <div className="flex shrink-0 flex-wrap items-center gap-2">
        <div className="inline-flex items-center rounded-lg bg-foreground/5 p-0.5">
          {TEMPLATES.map(opt => {
            const active = mode === opt.key
            return (
              <button
                key={opt.key}
                type="button"
                onClick={() => switchMode(opt.key)}
                aria-pressed={active}
                className={cn(
                  "rounded-md px-3 py-1 text-sm font-semibold transition",
                  active
                    ? "bg-foreground/10 text-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {opt.label}
              </button>
            )
          })}
        </div>

        <button
          type="button"
          onClick={() => setShowDsl(v => !v)}
          className={cn(
            "inline-flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-xs font-medium transition",
            showDsl
              ? "bg-foreground/10 text-foreground"
              : "text-muted-foreground hover:bg-foreground/5 hover:text-foreground",
          )}
        >
          <FileCode2 size={14} />
          Instrucciones
        </button>

        <div className="ml-auto flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => void generate()}
            disabled={loading}
            className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-foreground/10 px-2.5 text-xs font-medium hover:bg-foreground/15 disabled:opacity-50"
          >
            <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
            Generar
          </button>
          <button
            type="button"
            onClick={() => void onDownloadDxf()}
            disabled={!model || loading}
            className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-foreground/10 px-2.5 text-xs font-medium hover:bg-foreground/15 disabled:opacity-50"
          >
            <Download size={13} />
            DXF
          </button>
          <button
            type="button"
            onClick={() => void onSendToNesting()}
            disabled={!model || loading}
            className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-foreground/10 px-2.5 text-xs font-medium hover:bg-foreground/15 disabled:opacity-50"
          >
            <Boxes size={13} />
            Nesting
          </button>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-3 tablet:flex-row">
        {/* Params */}
        <aside className="flex max-h-[46vh] w-full shrink-0 flex-col gap-3 overflow-y-auto rounded-xl bg-foreground/5 p-3 tablet:max-h-none tablet:w-56 desktop:w-64">
          <p className="text-[11px] font-medium tracking-wide text-muted-foreground">
            PARÁMETROS · mm
          </p>

          {tira && (
            <>
              <div className="grid grid-cols-2 gap-2">
                <Field
                  label="Largo"
                  value={String((body as { length: number }).length)}
                  onChange={v =>
                    applyBody({ ...body, length: num(v, 211.25) } as CreatePieceBody)
                  }
                />
                <Field
                  label="Ancho"
                  value={String((body as { width: number }).width)}
                  onChange={v =>
                    applyBody({ ...body, width: num(v, 13.6) } as CreatePieceBody)
                  }
                />
                <Field
                  label="Radio extremo"
                  value={String((body as { endRadius?: number }).endRadius ?? 0)}
                  onChange={v =>
                    applyBody({
                      ...body,
                      endRadius: num(v, 0),
                    } as CreatePieceBody)
                  }
                />
                <Field
                  label="Espesor"
                  value={String((body as { thicknessMm?: number }).thicknessMm ?? 1.5)}
                  onChange={v =>
                    applyBody({
                      ...body,
                      thicknessMm: num(v, 1.5),
                    } as CreatePieceBody)
                  }
                />
              </div>
              <label className="flex flex-col gap-1">
                <span className="text-[11px] font-medium tracking-wide text-muted-foreground">
                  Material
                </span>
                <input
                  value={(body as { material?: string }).material ?? ""}
                  onChange={e =>
                    applyBody({
                      ...body,
                      material: e.target.value,
                    } as CreatePieceBody)
                  }
                  className="h-9 rounded-lg border-0 bg-foreground/5 px-3 text-sm outline-none ring-0 focus:bg-foreground/10"
                />
              </label>
              <div className="grid grid-cols-2 gap-2">
                <Field
                  label="Ø agujero"
                  value={String(
                    (body as { holes?: { diameter: number } }).holes?.diameter ?? 4,
                  )}
                  onChange={v => {
                    const holes = {
                      diameter: num(v, 4),
                      insetFromEnd:
                        (body as { holes?: { insetFromEnd: number } }).holes
                          ?.insetFromEnd ?? 8,
                      countPerEnd:
                        (body as { holes?: { countPerEnd: 1 | 2 } }).holes
                          ?.countPerEnd ?? 1,
                      spacing: (body as { holes?: { spacing?: number } }).holes
                        ?.spacing,
                    }
                    applyBody({ ...body, holes } as CreatePieceBody)
                  }}
                />
                <Field
                  label="Inset extremo"
                  value={String(
                    (body as { holes?: { insetFromEnd: number } }).holes
                      ?.insetFromEnd ?? 8,
                  )}
                  onChange={v => {
                    const prev = (body as { holes?: {
                      diameter: number
                      insetFromEnd: number
                      countPerEnd: 1 | 2
                      spacing?: number
                    } }).holes
                    applyBody({
                      ...body,
                      holes: {
                        diameter: prev?.diameter ?? 4,
                        insetFromEnd: num(v, 8),
                        countPerEnd: prev?.countPerEnd ?? 1,
                        spacing: prev?.spacing,
                      },
                    } as CreatePieceBody)
                  }}
                />
              </div>
              <div className="flex gap-1">
                {([1, 2] as const).map(n => {
                  const active =
                    ((body as { holes?: { countPerEnd: 1 | 2 } }).holes
                      ?.countPerEnd ?? 1) === n
                  return (
                    <button
                      key={n}
                      type="button"
                      onClick={() => {
                        const prev = (body as { holes?: {
                          diameter: number
                          insetFromEnd: number
                          countPerEnd: 1 | 2
                          spacing?: number
                        } }).holes
                        applyBody({
                          ...body,
                          holes: {
                            diameter: prev?.diameter ?? 4,
                            insetFromEnd: prev?.insetFromEnd ?? 8,
                            countPerEnd: n,
                            spacing: prev?.spacing ?? (n === 2 ? 6 : undefined),
                          },
                        } as CreatePieceBody)
                      }}
                      className={cn(
                        "flex-1 rounded-lg py-1.5 text-xs font-semibold transition",
                        active
                          ? "bg-foreground/10 text-foreground"
                          : "text-muted-foreground hover:bg-foreground/5",
                      )}
                    >
                      {n}/extremo
                    </button>
                  )
                })}
              </div>
              {((body as { holes?: { countPerEnd: 1 | 2 } }).holes
                ?.countPerEnd ?? 1) === 2 && (
                <Field
                  label="Spacing Y"
                  value={String(
                    (body as { holes?: { spacing?: number } }).holes?.spacing ?? 6,
                  )}
                  onChange={v => {
                    const prev = (body as { holes?: {
                      diameter: number
                      insetFromEnd: number
                      countPerEnd: 1 | 2
                    } }).holes
                    applyBody({
                      ...body,
                      holes: {
                        diameter: prev?.diameter ?? 4,
                        insetFromEnd: prev?.insetFromEnd ?? 8,
                        countPerEnd: 2,
                        spacing: num(v, 6),
                      },
                    } as CreatePieceBody)
                  }}
                />
              )}
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-medium tracking-wide text-muted-foreground">
                    Dobleces X
                  </span>
                  <button
                    type="button"
                    className="text-[11px] font-semibold text-muted-foreground hover:text-foreground"
                    onClick={() => {
                      const prev =
                        (body as { bends?: { positions: number[] } }).bends
                          ?.positions ?? []
                      applyBody({
                        ...body,
                        bends: { positions: [...prev, 0] },
                      } as CreatePieceBody)
                    }}
                  >
                    + agregar
                  </button>
                </div>
                {((body as { bends?: { positions: number[] } }).bends
                  ?.positions ?? []).map((pos, i) => (
                  <div key={i} className="flex items-center gap-1.5">
                    <input
                      type="number"
                      step="0.1"
                      value={String(pos)}
                      onChange={e => {
                        const prev = [
                          ...((body as { bends?: { positions: number[] } })
                            .bends?.positions ?? []),
                        ]
                        prev[i] = Number(e.target.value) || 0
                        applyBody({
                          ...body,
                          bends: { positions: prev },
                        } as CreatePieceBody)
                      }}
                      className="h-9 min-w-0 flex-1 rounded-lg border-0 bg-foreground/5 px-3 text-sm tabular-nums outline-none ring-0 focus:bg-foreground/10"
                    />
                    <button
                      type="button"
                      className="rounded-lg px-2 py-1 text-xs text-muted-foreground hover:text-destructive"
                      onClick={() => {
                        const prev = [
                          ...((body as { bends?: { positions: number[] } })
                            .bends?.positions ?? []),
                        ]
                        prev.splice(i, 1)
                        applyBody({
                          ...body,
                          bends: prev.length ? { positions: prev } : undefined,
                        } as CreatePieceBody)
                      }}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>

            </>
          )}

          {malla && (
            <div className="grid grid-cols-2 gap-2">
              {(
                [
                  ["width", "Ancho"],
                  ["height", "Alto"],
                  ["margin", "Margen"],
                  ["cols", "Columnas"],
                  ["rows", "Filas"],
                  ["holeWidth", "Hueco W"],
                  ["holeHeight", "Hueco H"],
                  ["thicknessMm", "Espesor"],
                ] as const
              ).map(([key, label]) => (
                <Field
                  key={key}
                  label={label}
                  step={key === "cols" || key === "rows" ? "1" : "0.1"}
                  value={String((body as Record<string, number>)[key] ?? 0)}
                  onChange={v =>
                    applyBody({
                      ...body,
                      [key]: num(
                        v,
                        key === "cols" || key === "rows" ? 1 : 0,
                      ),
                    } as CreatePieceBody)
                  }
                />
              ))}
              <label className="col-span-2 flex flex-col gap-1">
                <span className="text-[11px] font-medium tracking-wide text-muted-foreground">
                  Material
                </span>
                <input
                  value={(body as { material?: string }).material ?? ""}
                  onChange={e =>
                    applyBody({
                      ...body,
                      material: e.target.value,
                    } as CreatePieceBody)
                  }
                  className="h-9 rounded-lg border-0 bg-foreground/5 px-3 text-sm outline-none ring-0 focus:bg-foreground/10"
                />
              </label>
            </div>
          )}

          {plate && (
            <div className="grid grid-cols-2 gap-2">
              <Field
                label="Ancho"
                value={String((body as { width: number }).width)}
                onChange={v =>
                  applyBody({ ...body, width: num(v, 400) } as CreatePieceBody)
                }
              />
              <Field
                label="Alto"
                value={String((body as { height: number }).height)}
                onChange={v =>
                  applyBody({ ...body, height: num(v, 300) } as CreatePieceBody)
                }
              />
              <Field
                label="Ø agujero"
                value={String(
                  (body as { holes?: { diameter: number } }).holes?.diameter ?? 20,
                )}
                onChange={v =>
                  applyBody({
                    ...body,
                    holes: {
                      diameter: num(v, 20),
                      offset:
                        (body as { holes?: { offset: number } }).holes?.offset ??
                        50,
                    },
                  } as CreatePieceBody)
                }
              />
              <Field
                label="Offset"
                value={String(
                  (body as { holes?: { offset: number } }).holes?.offset ?? 50,
                )}
                onChange={v =>
                  applyBody({
                    ...body,
                    holes: {
                      diameter:
                        (body as { holes?: { diameter: number } }).holes
                          ?.diameter ?? 20,
                      offset: num(v, 50),
                    },
                  } as CreatePieceBody)
                }
              />
            </div>
          )}

          {/* Save template */}
          <div className="mt-1 flex flex-col gap-2 border-t border-border/60 pt-3">
            <p className="text-[11px] font-medium tracking-wide text-muted-foreground">
              PLANTILLA DE TALLER
            </p>
            <div className="flex gap-2">
              <input
                value={saveName}
                onChange={e => setSaveName(e.target.value)}
                placeholder="Nombre…"
                className="h-9 min-w-0 flex-1 rounded-lg border-0 bg-foreground/5 px-3 text-sm outline-none ring-0 focus:bg-foreground/10"
              />
              <button
                type="button"
                onClick={onSaveTemplate}
                className="inline-flex h-9 items-center gap-1 rounded-lg bg-foreground/10 px-2.5 text-xs font-medium hover:bg-foreground/15"
              >
                <Save size={13} />
                Guardar
              </button>
            </div>
            {saved.length > 0 && (
              <ul className="flex max-h-28 flex-col gap-1 overflow-y-auto">
                {saved
                  .filter(s => s.template === mode)
                  .map(s => (
                    <li
                      key={s.id}
                      className="flex items-center gap-1 rounded-lg bg-foreground/[0.04] px-2 py-1"
                    >
                      <button
                        type="button"
                        className="min-w-0 flex-1 truncate text-left text-xs font-medium hover:text-foreground"
                        onClick={() => {
                          setMode(s.template)
                          applyBody(s.body)
                          void generate(s.body)
                        }}
                      >
                        {s.name}
                      </button>
                      <button
                        type="button"
                        className="rounded p-1 text-muted-foreground hover:text-destructive"
                        onClick={() => {
                          removeCadTemplate(s.id)
                          refreshSaved()
                        }}
                      >
                        <Trash2 size={12} />
                      </button>
                    </li>
                  ))}
              </ul>
            )}
          </div>

          {error && <p className="text-xs text-red-400">{error}</p>}
          {model && (
            <p className="text-[11px] text-muted-foreground">
              {model.entities.length} entidades · {model.units}
            </p>
          )}
        </aside>

        {/* Preview + optional DSL */}
        <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-2">
          {showDsl && (
            <div className="flex shrink-0 flex-col gap-2 rounded-xl bg-foreground/5 p-2">
              <textarea
                value={dsl}
                onChange={e => setDsl(e.target.value)}
                rows={5}
                className="w-full resize-y rounded-lg bg-background/50 p-2 font-mono text-[11px] leading-relaxed outline-none focus:bg-background/80"
                spellCheck={false}
              />
              <button
                type="button"
                onClick={onApplyDsl}
                className="self-end rounded-lg bg-foreground/10 px-3 py-1.5 text-xs font-medium hover:bg-foreground/15"
              >
                Aplicar instrucciones
              </button>
            </div>
          )}
          <div className="relative min-h-0 flex-1 overflow-hidden rounded-xl bg-foreground/[0.03]">
            <DxfCanvas pieces={geometryModelToCanvasPieces(model)} />
          </div>
        </div>
      </div>
    </div>
  )
}
