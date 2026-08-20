import { useState, useEffect } from "react"
import { Search, Trash2, Plus, Layers } from "lucide-react"
import type { Skill } from "../types"
import { cadAiApi } from "../api/cad-ai.api"

interface SkillLibraryProps {
  onOpenSkill: (skill: Skill) => void
  onClose: () => void
}

export function SkillLibrary({ onOpenSkill, onClose }: SkillLibraryProps) {
  const [skills, setSkills] = useState<Skill[]>([])
  const [search, setSearch] = useState("")
  const [loading, setLoading] = useState(true)

  const loadSkills = async () => {
    try {
      const data = await cadAiApi.getSkills()
      setSkills(data)
    } catch (err) {
      console.error("Failed to load skills:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadSkills()
  }, [])

  const handleDelete = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!confirm("¿Eliminar esta skill?")) return
    try {
      await cadAiApi.deleteSkill(id)
      setSkills(skills.filter(s => s.id !== id))
    } catch (err) {
      console.error("Failed to delete skill:", err)
    }
  }

  const filtered = skills.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.description.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-2 sm:p-4">
      <div className="bg-card rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] sm:max-h-[85vh] flex flex-col min-h-0">
        <div className="p-4 sm:p-6 border-b border-border flex-shrink-0">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <div className="flex items-center gap-2 min-w-0">
              <Layers className="w-5 h-5 text-foreground flex-shrink-0" />
              <h2 className="text-lg sm:text-xl font-bold text-foreground truncate">Biblioteca de Skills</h2>
            </div>
            <button
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground text-2xl leading-none flex-shrink-0 ml-2"
            >
              ×
            </button>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar skills..."
              className="w-full rounded-md border border-input bg-background pl-10 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-6">
          {loading ? (
            <div className="text-center text-muted-foreground py-12">Cargando skills...</div>
          ) : filtered.length === 0 ? (
            <div className="text-center text-muted-foreground py-12">
              <Plus className="w-12 h-12 mx-auto mb-3 opacity-40" />
              <p>No hay skills guardadas aún</p>
              <p className="text-xs mt-1">Analiza un plano y guárdalo como skill para reutilizarlo</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {filtered.map(skill => (
                <div
                  key={skill.id}
                  onClick={() => onOpenSkill(skill)}
                  className="group relative rounded-lg border border-border bg-card p-4 cursor-pointer hover:border-primary/50 hover:shadow-md transition-all"
                >
                  <div className="aspect-square mb-3 rounded-md bg-secondary flex items-center justify-center overflow-hidden">
                    {skill.thumbnail && !skill.thumbnail.startsWith("blob:") ? (
                      <img
                        src={skill.thumbnail}
                        alt={skill.name}
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <Layers className="w-8 h-8 text-muted-foreground/40" />
                    )}
                  </div>
                  <h3 className="font-semibold text-sm text-foreground truncate">{skill.name}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{skill.description}</p>
                  <div className="flex items-center gap-1 mt-2">
                    <span className="text-xs bg-secondary px-2 py-0.5 rounded">
                      {skill.parameters.length} parámetros
                    </span>
                  </div>
                  <button
                    onClick={e => handleDelete(skill.id, e)}
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 p-1.5 rounded-md bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-all"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
