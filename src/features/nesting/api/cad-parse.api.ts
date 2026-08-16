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

    const res = await api.post<CadParseResponse>("/engineering/cad/parse", form, {
      signal,
      timeout: 120_000,
      // Evita toast global por cada archivo en import masivo
      // @ts-expect-error custom axios flag leída en api-client
      skipGlobalErrorToast: true,
      headers: {
        "Content-Type": undefined as unknown as string,
      },
      maxBodyLength: Infinity,
      maxContentLength: Infinity,
    })
    return res.data
  },
}
