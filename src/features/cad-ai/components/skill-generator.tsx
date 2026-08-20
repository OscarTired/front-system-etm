import { useState, useEffect, useRef } from "react"
import { Download, Loader2, X, ArrowRight } from "lucide-react"
import type { Skill, PlanGeometry } from "../types"
import { cadAiApi, downloadDxf } from "../api/cad-ai.api"
import { DxfViewer } from "../components/dxf-viewer"

interface SkillGeneratorProps {
  skill: Skill
  onClose: () => void
  onLoadToWorkspace?: (geometry: PlanGeometry, dxf: string) => void
}

export function SkillGenerator({ skill, onClose, onLoadToWorkspace }: SkillGeneratorProps) {
  const [params, setParams] = useState<Record<string, number | string>>({})
  const [geometry, setGeometry] = useState<PlanGeometry | null>(null)
  const [dxf, setDxf] = useState<string>("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const geometryRef = useRef<PlanGeometry | null>(null)

  useEffect(() => {
    const defaults: Record<string, number | string> = {}
    for (const p of skill.parameters) {
      defaults[p.name] = p.default
    }
    setParams(defaults)
  }, [skill])

  const handleGenerate = async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await cadAiApi.generateFromSkill(skill.id, params)
      setGeometry(result.geometry)
      geometryRef.current = result.geometry
      setDxf(result.dxf)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (Object.keys(params).length > 0) {
      handleGenerate()
    }
  }, [params])

  const handleParamChange = (name: string, value: string) => {
    const num = parseFloat(value)
    setParams(prev => ({ ...prev, [name]: isNaN(num) ? value : num }))
  }

  const handleDownload = async () => {
    const geom = geometryRef.current
    if (!geom) return
    try {
      const freshDxf = await cadAiApi.exportDxf(geom)
      downloadDxf(freshDxf, `${skill.name}.dxf`)
    } catch (err: any) {
      setError(err.message)
    }
  }

  const handleLoadToWorkspace = () => {
    const geom = geometryRef.current
    if (!geom) return
    onLoadToWorkspace?.(geom, dxf)
  }

  return (
    // Mobile: modal bleeds edge-to-edge and takes the full viewport height (definite height).
    // Desktop (sm+): centered card with an explicit height, not just a max-height —
    // this is what lets every child below correctly compute how much space it has,
    // instead of growing to fit content and getting clipped or pushed off-screen.
    <div className="fixed inset-0 z-50 bg-black/50 flex sm:items-center sm:justify-center sm:p-4">
      <div className="bg-card w-full h-full sm:h-[85vh] sm:max-h-[820px] sm:max-w-5xl rounded-none sm:rounded-xl shadow-xl flex flex-col min-h-0 overflow-hidden">

        {/* Header — always visible, fixed size. Action buttons live here so they
            are never clipped by viewer height calculations. */}
        <div className="flex items-center justify-between gap-2 px-4 py-3 sm:px-5 sm:py-4 border-b border-border flex-shrink-0">
          <div className="min-w-0 flex-1">
            <h2 className="text-base sm:text-lg font-bold text-foreground truncate">{skill.name}</h2>
            {skill.description && (
              <p className="text-xs text-muted-foreground truncate">{skill.description}</p>
            )}
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
            <button
              onClick={handleDownload}
              disabled={!geometry || loading}
              className="flex items-center gap-1.5 rounded-md border border-border bg-card px-2.5 sm:px-3 py-1.5 text-xs sm:text-sm font-medium hover:bg-secondary transition-colors disabled:opacity-50"
              title="Descargar DXF"
            >
              <Download className="w-4 h-4" />
              <span className="hidden md:inline">Descargar DXF</span>
            </button>
            {onLoadToWorkspace && (
              <button
                onClick={handleLoadToWorkspace}
                disabled={!geometry || loading}
                className="flex items-center gap-1.5 rounded-md bg-primary text-primary-foreground px-2.5 sm:px-3 py-1.5 text-xs sm:text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
                title="Abrir en workspace"
              >
                <ArrowRight className="w-4 h-4" />
                <span className="hidden md:inline">Abrir en workspace</span>
              </button>
            )}
            <button
              onClick={onClose}
              aria-label="Cerrar"
              className="p-2 -m-1 rounded-md hover:bg-secondary transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Body: stacked on mobile, side-by-side on desktop. flex-1 + min-h-0 gives it
            a definite height derived from the card, so its children never overflow it. */}
        <div className="flex-1 min-h-0 flex flex-col sm:flex-row">

          {/* Params — its own mini flex column so the field list scrolls internally
              without ever affecting the height of the viewer/footer next to it. */}
          <div className="flex flex-col min-h-0 max-h-[36vh] sm:max-h-none sm:w-64 lg:w-72 sm:flex-shrink-0 border-b sm:border-b-0 sm:border-r border-border">
            <div className="px-4 pt-3 pb-2 flex-shrink-0 flex items-center justify-between">
              <h3 className="font-semibold text-sm text-foreground">Parámetros</h3>
              {skill.parameters.length > 0 && (
                <span className="text-[11px] text-muted-foreground">{skill.parameters.length}</span>
              )}
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto px-4 pb-4 space-y-3">
              {skill.parameters.map(param => (
                <div key={param.name}>
                  <label className="block text-xs font-medium text-foreground mb-1">
                    {param.label}
                    {param.unit && <span className="text-muted-foreground ml-1">({param.unit})</span>}
                  </label>
                  <input
                    type="number"
                    inputMode="decimal"
                    value={params[param.name] ?? ""}
                    onChange={e => handleParamChange(param.name, e.target.value)}
                    className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
              ))}
              {skill.parameters.length === 0 && (
                <p className="text-xs text-muted-foreground">Esta skill no tiene parámetros ajustables.</p>
              )}
              {error && <p className="text-xs text-destructive">{error}</p>}
            </div>
          </div>

          {/* Viewer — takes all remaining space. Action buttons are in the header. */}
          <div className="flex-1 min-h-0 relative">
            {loading && (
              <div className="absolute inset-0 z-10 bg-white/60 flex items-center justify-center">
                <Loader2 className="w-6 h-6 text-primary animate-spin" />
              </div>
            )}
            <DxfViewer
              geometry={geometry}
              onGeometryChange={(g) => { geometryRef.current = g }}
              className="w-full h-full"
            />
          </div>
        </div>
      </div>
    </div>
  )
}