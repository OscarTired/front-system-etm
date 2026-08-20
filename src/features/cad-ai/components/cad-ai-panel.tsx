"use client"

import { useState, useCallback, useRef } from "react"
import { Loader2, Layers } from "lucide-react"
import type { PlanGeometry, Entity, ChatMessage, Skill } from "../types"
import { cadAiApi, downloadDxf } from "../api/cad-ai.api"
import { UploadZone } from "./upload-zone"
import { DxfViewer } from "./dxf-viewer"
import { IterationPanel } from "./iteration-panel"
import { SaveSkillModal } from "./save-skill-modal"
import { SkillLibrary } from "./skill-library"
import { SkillGenerator } from "./skill-generator"

export function CadAiPanel() {
  const [geometry, setGeometry] = useState<PlanGeometry | null>(null)
  const [dxf, setDxf] = useState<string>("")
  const [imagePath, setImagePath] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [selectedForAI, setSelectedForAI] = useState<Entity[] | null>(null)
  const [showSaveSkill, setShowSaveSkill] = useState(false)
  const [showSkillLibrary, setShowSkillLibrary] = useState(false)
  const [activeSkill, setActiveSkill] = useState<Skill | null>(null)
  const [skillParams, setSkillParams] = useState<Record<string, number | string> | null>(null)
  const [skillGenerator, setSkillGenerator] = useState<Skill | null>(null)

  const geometryRef = useRef<PlanGeometry | null>(null)

  const handleAnalyze = useCallback(async (file: File) => {
    setLoading(true)
    setError(null)
    setImagePath(URL.createObjectURL(file))
    try {
      const result = await cadAiApi.analyzeImage(file)
      setGeometry(result.geometry)
      setDxf(result.dxf)
      geometryRef.current = result.geometry
      setMessages(prev => [...prev, {
        role: "assistant",
        content: `He analizado tu plano. Encontré ${result.geometry.entities.length} entidades.`,
        geometry: result.geometry,
      }])
    } catch (err: any) {
      setError(err.message || "Error al analizar la imagen")
    } finally {
      setLoading(false)
    }
  }, [])

  const handleGenerate = useCallback(async (prompt: string) => {
    setLoading(true)
    setError(null)
    setMessages(prev => [...prev, { role: "user", content: prompt }])
    try {
      const result = await cadAiApi.generateFromText(prompt)
      setGeometry(result.geometry)
      setDxf(result.dxf)
      geometryRef.current = result.geometry
      setMessages(prev => [...prev, {
        role: "assistant",
        content: `He generado la geometría: ${result.geometry.entities.length} entidades, ${result.geometry.dimensions.width}×${result.geometry.dimensions.height} ${result.geometry.units}.`,
        geometry: result.geometry,
      }])
    } catch (err: any) {
      setError(err.message || "Error al generar la geometría")
      setMessages(prev => [...prev, {
        role: "assistant",
        content: `Error: ${err.message || "No se pudo generar la geometría."}`,
      }])
    } finally {
      setLoading(false)
    }
  }, [])

  const handleIterate = useCallback(async (feedback: string) => {
    if (!geometry) return
    setLoading(true)
    setError(null)
    setMessages(prev => [...prev, { role: "user", content: feedback }])
    try {
      const result = await cadAiApi.iterateGeometry(geometry, feedback, selectedForAI || undefined)
      setGeometry(result.geometry)
      setDxf(result.dxf)
      geometryRef.current = result.geometry
      setSelectedForAI(null)
      setMessages(prev => [...prev, {
        role: "assistant",
        content: `He actualizado la geometría. Ahora tiene ${result.geometry.entities.length} entidades.`,
        geometry: result.geometry,
      }])
    } catch (err: any) {
      setError(err.message || "Error al iterar")
      setMessages(prev => [...prev, {
        role: "assistant",
        content: `Error: ${err.message || "No se pudo procesar el cambio."}`,
      }])
    } finally {
      setLoading(false)
    }
  }, [geometry, selectedForAI])

  const handleGeometryChange = useCallback((newGeom: PlanGeometry) => {
    setGeometry(newGeom)
    geometryRef.current = newGeom
  }, [])

  const handleSendToAI = useCallback((entities: Entity[]) => {
    setSelectedForAI(entities)
  }, [])

  const handleClearAISelection = useCallback(() => {
    setSelectedForAI(null)
  }, [])

  const handleDownload = useCallback(async () => {
    const geom = geometryRef.current
    if (!geom) return
    try {
      const freshDxf = await cadAiApi.exportDxf(geom)
      downloadDxf(freshDxf)
    } catch (err: any) {
      setError(err.message || "Error al exportar DXF")
    }
  }, [])

  const handleReset = useCallback(() => {
    setGeometry(null)
    setDxf("")
    setImagePath(null)
    setError(null)
    setMessages([])
    setSelectedForAI(null)
    setActiveSkill(null)
    setSkillParams(null)
    geometryRef.current = null
  }, [])

  const handleSaveSkill = useCallback(() => {
    setShowSaveSkill(true)
  }, [])

  const handleSkillSaved = useCallback((skill: Skill) => {
    setShowSaveSkill(false)
    setActiveSkill(skill)
    const defaults: Record<string, number | string> = {}
    for (const p of skill.parameters) defaults[p.name] = p.default
    setSkillParams(defaults)
  }, [])

  const handleOpenSkill = useCallback((skill: Skill) => {
    setShowSkillLibrary(false)
    setSkillGenerator(skill)
  }, [])

  const handleLoadToWorkspace = useCallback((geom: PlanGeometry, dxfContent: string) => {
    setGeometry(geom)
    setDxf(dxfContent)
    geometryRef.current = geom
    setSkillGenerator(null)
    setActiveSkill(null)
    setSkillParams(null)
    setMessages(prev => [...prev, {
      role: "assistant",
      content: `He cargado la geometría desde la skill. Encontré ${geom.entities.length} entidades. ¿Qué cambios te gustaría hacer?`,
      geometry: geom,
    }])
  }, [])

  const handleSkillRegenerate = useCallback(async () => {
    if (!activeSkill || !skillParams) return
    setLoading(true)
    setError(null)
    try {
      const result = await cadAiApi.generateFromSkill(activeSkill.id, skillParams)
      setGeometry(result.geometry)
      setDxf(result.dxf)
      geometryRef.current = result.geometry
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [activeSkill, skillParams])

  if (!geometry) {
    return (
      <div className="flex h-full min-h-0 flex-col">
        {error && (
          <div className="px-4 py-2 bg-destructive/10 border-b border-destructive/20 text-sm text-destructive flex items-center justify-between">
            <span>{error}</span>
            <button onClick={() => setError(null)} className="text-destructive hover:opacity-70">×</button>
          </div>
        )}
        <UploadZone onAnalyze={handleAnalyze} onGenerate={handleGenerate} loading={loading} messages={messages} />
        <div className="flex items-center justify-center gap-2 py-2 border-t border-border bg-card">
          <button
            onClick={() => setShowSkillLibrary(true)}
            className="flex items-center gap-2 rounded-md border border-border bg-card px-4 py-1.5 text-sm font-medium hover:bg-secondary transition-colors"
          >
            <Layers className="w-4 h-4" />
            Biblioteca de Skills
          </button>
        </div>
        {showSkillLibrary && (
          <SkillLibrary onOpenSkill={handleOpenSkill} onClose={() => setShowSkillLibrary(false)} />
        )}
        {skillGenerator && (
          <SkillGenerator skill={skillGenerator} onClose={() => setSkillGenerator(null)} onLoadToWorkspace={handleLoadToWorkspace} />
        )}
      </div>
    )
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      {error && (
        <div className="px-4 py-2 bg-destructive/10 border-b border-destructive/20 text-sm text-destructive flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-destructive hover:opacity-70">×</button>
        </div>
      )}
      <div className="flex flex-1 min-h-0">
        <div className="flex-1 min-h-0 relative">
          {loading && (
            <div className="absolute inset-0 z-30 bg-white/60 flex items-center justify-center">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
          )}
          <DxfViewer
            geometry={geometry}
            onGeometryChange={handleGeometryChange}
            onSendToAI={handleSendToAI}
            className="w-full h-full"
          />
        </div>
        <div className="w-80 flex-shrink-0 min-h-0">
          <IterationPanel
            geometry={geometry}
            dxf={dxf}
            imagePath={imagePath}
            onIterate={handleIterate}
            onSaveSkill={handleSaveSkill}
            onDownload={handleDownload}
            onReset={handleReset}
            loading={loading}
            messages={messages}
            selectedForAI={selectedForAI}
            onClearAISelection={handleClearAISelection}
            activeSkill={activeSkill}
            skillParams={skillParams}
            onSkillParamsChange={setSkillParams}
            onSkillRegenerate={handleSkillRegenerate}
          />
        </div>
      </div>
      {showSaveSkill && (
        <SaveSkillModal
          geometry={geometry}
          thumbnailPath={imagePath && !imagePath.startsWith("blob:") ? imagePath : null}
          onSaved={handleSkillSaved}
          onClose={() => setShowSaveSkill(false)}
        />
      )}
      {skillGenerator && (
        <SkillGenerator skill={skillGenerator} onClose={() => setSkillGenerator(null)} onLoadToWorkspace={handleLoadToWorkspace} />
      )}
    </div>
  )
}
