import { api } from "@/lib/api"

import type { Area } from "../types/area.types"

export const areasService = {

  async getAll(signal?: AbortSignal) {
    const response = await api.get<Area[]>("/areas", { signal })
    return response.data
  },

}