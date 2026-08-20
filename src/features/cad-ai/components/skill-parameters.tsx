import { useState } from "react"
import { SlidersHorizontal, ChevronDown, ChevronUp, RefreshCw } from "lucide-react"
import type { Skill } from "../types"

interface SkillParametersProps {
  skill: Skill
  params: Record<string, number | string>
  onParamsChange: (params: Record<string, number | string>) => void
  onRegenerate: () => void
  loading: boolean
}

export function SkillParameters({ skill, params, onParamsChange, onRegenerate, loading }: SkillParametersProps) {
  const [expanded, setExpanded] = useState(true)

  const handleChange = (name: string, value: string) => {
    const num = parseFloat(value)
    onParamsChange({ ...params, [name]: isNaN(num) ? value : num })
  }

  if (skill.parameters.length === 0) return null

  return (
    <div className="rounded-md border border-border bg-secondary/30 overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold text-foreground hover:bg-secondary/50 transition-colors"
      >
        <span className="flex items-center gap-1.5">
          <SlidersHorizontal className="w-3.5 h-3.5" />
          Parámetros · {skill.name}
        </span>
        {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
      </button>

      {expanded && (
        <div className="px-3 pb-3 pt-1 space-y-2">
          {skill.parameters.map(param => (
            <div key={param.name} className="flex items-center gap-2">
              <label className="flex-1 text-xs text-muted-foreground truncate" title={param.label}>
                {param.label}
                {param.unit && <span className="ml-0.5 opacity-60">({param.unit})</span>}
              </label>
              <input
                type="number"
                value={params[param.name] ?? ""}
                onChange={e => handleChange(param.name, e.target.value)}
                className="w-20 rounded border border-input bg-background px-2 py-1 text-xs text-right focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>
          ))}
          <button
            onClick={onRegenerate}
            disabled={loading}
            className="w-full flex items-center justify-center gap-1.5 rounded-md bg-primary/10 text-primary px-3 py-1.5 text-xs font-medium hover:bg-primary/20 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            Regenerar
          </button>
        </div>
      )}
    </div>
  )
}
