import { api } from "@/lib/api"
import type { NestingPiece } from "../engine/types"

export type CadParseResponse = {
  pieces: NestingPiece[]
  pieceCount: number
  width?: number
  height?: number
  valid: boolean
}

export const cadParseApi = {
  async parseFile(file: File, signal?: AbortSignal): Promise<CadParseResponse> {
    const form = new FormData()
    form.append("file", file, file.name)
    // No fijar Content-Type: el browser añade multipart boundary.
    const res = await api.post<CadParseResponse>("/engineering/cad/parse", form, {
      signal,
      timeout: 120_000,
    })
    return res.data
  },
}
