import { api } from "@/lib/api"
import type {
  NestedSheet,
  NestingOptions,
  NestingPiece,
} from "../engine/types"

export type NestRunRequest = {
  pieces: NestingPiece[]
  options: Omit<NestingOptions, "onProgress" | "signal">
}

export type NestRunResponse = {
  sheets: NestedSheet[]
  pieceCount: number
  sheetCount: number
}

export const nestingRunApi = {
  async run(body: NestRunRequest, signal?: AbortSignal) {
    const res = await api.post<NestRunResponse>("/engineering/nest", body, {
      signal,
      // nests grandes pueden tardar
      timeout: 120_000,
    })
    return res.data
  },
}
