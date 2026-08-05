import { api } from "@/lib/api"
import type { ProjectFile } from "../export/project-file"

export type NestingProjectMeta = {
  type: "nesting-project"
  name: string
  formatVersion: number
  pieceCount: number
  sheetCount: number
  hasNesting: boolean
}

export type NestingProjectRecord = {
  id: string
  originalName: string
  filename: string
  extension: string
  mimeType: string
  size: number
  status: string
  metadata: NestingProjectMeta | null
  createdAt: string
  updatedAt: string
}

export const nestingProjectsApi = {
  async list(signal?: AbortSignal) {
    const res = await api.get<NestingProjectRecord[]>(
      "/engineering/nesting-projects",
      { signal },
    )
    return res.data
  },

  async get(id: string, signal?: AbortSignal) {
    const res = await api.get<ProjectFile>(
      `/engineering/nesting-projects/${id}`,
      { signal },
    )
    return res.data
  },

  async create(payload: { name?: string; project: ProjectFile }) {
    const res = await api.post<NestingProjectRecord>(
      "/engineering/nesting-projects",
      payload,
    )
    return res.data
  },

  async update(id: string, payload: { name?: string; project: ProjectFile }) {
    const res = await api.put<NestingProjectRecord>(
      `/engineering/nesting-projects/${id}`,
      payload,
    )
    return res.data
  },

  async remove(id: string) {
    await api.delete(`/engineering/nesting-projects/${id}`)
  },
}
