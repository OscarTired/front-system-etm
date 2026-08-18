import { api } from "@/lib/api"
import type { CreatePieceBody, GeometryModel } from "../types/geometry-model"
import type { NestingPiece } from "@/features/nesting/engine/types"

export const cadPieceApi = {
  async generate(body: CreatePieceBody, signal?: AbortSignal) {
    const res = await api.post<GeometryModel>("/engineering/cad/piece", body, {
      signal,
      params: { format: "json" },
    })
    return res.data
  },

  async downloadDxf(body: CreatePieceBody) {
    const res = await api.post<Blob>("/engineering/cad/piece", body, {
      params: { format: "dxf" },
      responseType: "blob",
    })
    return res.data
  },

  async asNestingPiece(body: CreatePieceBody, signal?: AbortSignal) {
    const res = await api.post<NestingPiece>("/engineering/cad/piece", body, {
      signal,
      params: { format: "piece" },
    })
    return res.data
  },
}
