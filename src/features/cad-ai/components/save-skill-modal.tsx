import { useState } from "react"
import { Save, X, Loader2 } from "lucide-react"
import type { PlanGeometry, Skill } from "../types"
import { cadAiApi } from "../api/cad-ai.api"

interface SaveSkillModalProps {
  geometry: PlanGeometry
  thumbnailPath: string | null
  onSaved: (skill: Skill) => void
  onClose: () => void
}

export function SaveSkillModal({ geometry, thumbnailPath, onSaved, onClose }: SaveSkillModalProps) {
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSave = async () => {
    if (!name.trim()) {
      setError("El nombre es obligatorio")
      return
    }
    setLoading(true)
    setError(null)
    try {
      const skill = await cadAiApi.createSkill({
        name: name.trim(),
        description: description.trim(),
        geometry,
        thumbnailPath: thumbnailPath || undefined,
      })
      onSaved(skill)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-card rounded-xl shadow-xl w-full max-w-md">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Save className="w-5 h-5 text-foreground" />
            <h2 className="text-lg font-bold text-foreground">Guardar como Skill</h2>
          </div>
          <button onClick={onClose} className="p-2 rounded-md hover:bg-secondary transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Nombre *</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Ej: Soporte rectangular con agujeros"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Descripción</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Descripción breve de la pieza..."
              rows={3}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div className="rounded-md bg-secondary p-3 text-xs text-muted-foreground">
            <p className="font-medium text-foreground mb-1">La IA detectará automáticamente:</p>
            <p>Los parámetros ajustables (largo, ancho, diámetros, etc.) y creará una plantilla paramétrica reutilizable.</p>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>

        <div className="p-4 border-t border-border flex justify-end gap-2">
          <button
            onClick={onClose}
            className="rounded-md border border-border bg-card px-4 py-2 text-sm font-medium hover:bg-secondary transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={loading || !name.trim()}
            className="flex items-center gap-2 rounded-md bg-primary text-primary-foreground px-4 py-2 text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Guardar
          </button>
        </div>
      </div>
    </div>
  )
}
