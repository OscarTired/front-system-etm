import { api } from "@/lib/api"
import type { CreatePlateBody, GeometryModel } from "../types/geometry-model"

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
}
