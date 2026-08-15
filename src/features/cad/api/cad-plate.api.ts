import { api } from "@/lib/api"
import type { CreatePlateBody, GeometryModel } from "../types/geometry-model"
import type { NestingPiece } from "@/features/nesting/engine/types"

export const cadPlateApi = {
  async generate(body: CreatePlateBody, signal?: AbortSignal) {
    const res = await api.post<GeometryModel>("/engineering/cad/plate", body, {
      signal,
      params: { format: "json" },
    })
    return res.data
  },

  async downloadDxf(body: CreatePlateBody) {
    const res = await api.post<Blob>("/engineering/cad/plate", body, {
      params: { format: "dxf" },
      responseType: "blob",
    })
    return res.data
  },

  /** NestingPiece listo para el motor / lista de piezas. */
  async asNestingPiece(body: CreatePlateBody, signal?: AbortSignal) {
    const res = await api.post<NestingPiece>("/engineering/cad/plate", body, {
      signal,
      params: { format: "piece" },
    })
    return res.data
  },
}

export { PENDING_NESTING_PIECES_KEY } from "../pending-nesting-pieces"
