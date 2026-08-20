import { useState, useRef, useEffect } from "react"
import { Send, Loader2, User, Bot, Save, Download, RotateCcw, X, MousePointerClick } from "lucide-react"
import type { PlanGeometry, ChatMessage, Entity, Skill } from "../types"
import { SkillParameters } from "./skill-parameters"

interface IterationPanelProps {
  geometry: PlanGeometry
  dxf: string
  imagePath: string | null
  onIterate: (feedback: string) => void
  onSaveSkill: () => void
  onDownload: () => void
  onReset: () => void
  loading: boolean
  messages: ChatMessage[]
  selectedForAI?: Entity[] | null
  onClearAISelection?: () => void
  activeSkill?: Skill | null
  skillParams?: Record<string, number | string> | null
  onSkillParamsChange?: (params: Record<string, number | string>) => void
  onSkillRegenerate?: () => void
}

export function IterationPanel({
  geometry,
  dxf: _dxf,
  imagePath,
  onIterate,
  onSaveSkill,
  onDownload,
  onReset,
  loading,
  messages,
  selectedForAI,
  onClearAISelection,
  activeSkill,
  skillParams,
  onSkillParamsChange,
  onSkillRegenerate,
}: IterationPanelProps) {
  const [input, setInput] = useState("")
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 160
    if (nearBottom) el.scrollTop = el.scrollHeight
  }, [messages, loading])

  const handleSend = () => {
    if (!input.trim() || loading) return
    onIterate(input.trim())
    setInput("")
    requestAnimationFrame(() => {
      const ta = document.getElementById("iteration-input") as HTMLTextAreaElement | null
      if (ta) ta.style.height = "auto"
    })
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value)
    const ta = e.target
    ta.style.height = "auto"
    ta.style.height = `${Math.min(ta.scrollHeight, 140)}px`
  }

  return (
    <div className="flex flex-col h-full min-h-0 bg-card border-l border-border">
      <div className="p-4 border-b border-border flex-shrink-0">
        <h2 className="font-semibold text-foreground">Iteración</h2>
        <p className="text-xs text-muted-foreground mt-0.5">Describe cambios en lenguaje natural</p>
      </div>

      <div ref={scrollRef} className="flex-1 min-h-0 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
            <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
              msg.role === "user" ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground"
            }`}>
              {msg.role === "user" ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
            </div>
            <div className={`flex-1 min-w-0 rounded-lg p-3 text-sm ${
              msg.role === "user" ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground"
            }`}>
              <p className="whitespace-pre-wrap break-words">{msg.content}</p>
              {msg.geometry && (
                <p className="text-xs mt-2 opacity-70">
                  {msg.geometry.entities.length} entidades · {msg.geometry.dimensions.width}×{msg.geometry.dimensions.height} {msg.geometry.units}
                </p>
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex gap-3">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
              <Loader2 className="w-4 h-4 animate-spin" />
            </div>
            <div className="bg-secondary rounded-lg p-3 text-sm text-muted-foreground">
              Procesando...
            </div>
          </div>
        )}
      </div>

      <div className="p-4 border-t border-border space-y-3 flex-shrink-0 overflow-y-auto">
        {activeSkill && skillParams && onSkillParamsChange && onSkillRegenerate && (
          <SkillParameters
            skill={activeSkill}
            params={skillParams}
            onParamsChange={onSkillParamsChange}
            onRegenerate={onSkillRegenerate}
            loading={loading}
          />
        )}

        {selectedForAI && selectedForAI.length > 0 && (
          <div className="rounded-md bg-orange-50 border border-orange-200 px-3 py-2 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-xs text-orange-700">
              <MousePointerClick className="w-3.5 h-3.5 flex-shrink-0" />
              <span>{selectedForAI.length} entidad(es) seleccionada(s) para IA</span>
            </div>
            <button
              onClick={onClearAISelection}
              className="text-orange-500 hover:text-orange-700 flex-shrink-0"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        <div className="flex gap-2">
          <button
            onClick={onDownload}
            className="flex-1 flex items-center justify-center gap-2 rounded-md bg-primary text-primary-foreground px-4 py-2 text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            <Download className="w-4 h-4" />
            DXF
          </button>
          <button
            onClick={onSaveSkill}
            className="flex-1 flex items-center justify-center gap-2 rounded-md border border-border bg-card px-4 py-2 text-sm font-medium hover:bg-secondary transition-colors"
          >
            <Save className="w-4 h-4" />
            Guardar Skill
          </button>
          <button
            onClick={onReset}
            className="flex items-center justify-center gap-2 rounded-md border border-border bg-card px-3 py-2 text-sm font-medium hover:bg-secondary transition-colors"
            title="Empezar de nuevo"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>

        <div className="flex gap-2">
          <textarea
            id="iteration-input"
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder={selectedForAI && selectedForAI.length > 0
              ? `Describe qué cambiar en las ${selectedForAI.length} entidades seleccionadas...`
              : "Ej: el agujero debe ser de 10mm, añade un chaflán de 2mm en la esquina superior derecha..."}
            rows={2}
            className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm resize-none overflow-y-auto focus:outline-none focus:ring-2 focus:ring-ring"
            disabled={loading}
          />
          <button
            onClick={handleSend}
            disabled={loading || !input.trim()}
            className="self-end rounded-md bg-primary text-primary-foreground p-2.5 hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
