import { api } from "@/lib/api"
import type { CreateTiraBody, GeometryModel } from "../types/geometry-model"
import type { NestingPiece } from "@/features/nesting/engine/types"

export const cadPieceApi = {
  async generate(body: CreateTiraBody, signal?: AbortSignal) {
    const res = await api.post<GeometryModel>("/engineering/cad/piece", body, {
      signal,
      params: { format: "json" },
    })
    return res.data
  },

  async downloadDxf(body: CreateTiraBody) {
    const res = await api.post<Blob>("/engineering/cad/piece", body, {
      params: { format: "dxf" },
      responseType: "blob",
    })
    return res.data
  },

  async asNestingPiece(body: CreateTiraBody, signal?: AbortSignal) {
    const res = await api.post<NestingPiece>("/engineering/cad/piece", body, {
      signal,
      params: { format: "piece" },
    })
    return res.data
  },
}
