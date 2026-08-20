import { api } from "@/lib/api"
import type {
  AnalyzeResponse,
  IterateResponse,
  GenerateResponse,
  Skill,
  PlanGeometry,
  Entity,
} from "../types"

export const cadAiApi = {
  async analyzeImage(file: File): Promise<AnalyzeResponse> {
    const formData = new FormData()
    formData.append("image", file)

    const res = await api.post<AnalyzeResponse>("/cad-ai/analyze", formData)
    return res.data
  },

  async iterateGeometry(
    geometry: PlanGeometry,
    feedback: string,
    selectedEntities?: Entity[],
  ): Promise<IterateResponse> {
    const res = await api.post<IterateResponse>("/cad-ai/iterate", {
      geometry,
      feedback,
      selectedEntities,
    })
    return res.data
  },

  async generateFromText(prompt: string): Promise<GenerateResponse> {
    const res = await api.post<GenerateResponse>("/cad-ai/generate", { prompt })
    return res.data
  },

  async exportDxf(geometry: PlanGeometry): Promise<string> {
    const res = await api.post<{ dxf: string }>("/cad-ai/export-dxf", { geometry })
    return res.data.dxf
  },

  async getSkills(): Promise<Skill[]> {
    const res = await api.get<Skill[]>("/cad-ai/skills")
    return res.data
  },

  async getSkill(id: number): Promise<Skill> {
    const res = await api.get<Skill>(`/cad-ai/skills/${id}`)
    return res.data
  },

  async createSkill(body: {
    name: string
    description?: string
    geometry: PlanGeometry
    thumbnailPath?: string
  }): Promise<Skill> {
    const res = await api.post<Skill>("/cad-ai/skills", body)
    return res.data
  },

  async deleteSkill(id: number): Promise<void> {
    await api.delete(`/cad-ai/skills/${id}`)
  },

  async generateFromSkill(
    id: number,
    params: Record<string, number | string>,
  ): Promise<GenerateResponse> {
    const res = await api.post<GenerateResponse>(`/cad-ai/skills/${id}/generate`, params)
    return res.data
  },
}

export function downloadDxf(dxfContent: string, filename = "part.dxf") {
  const blob = new Blob([dxfContent], { type: "application/dxf" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
