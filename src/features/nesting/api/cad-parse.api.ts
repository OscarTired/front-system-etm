import { api } from "@/lib/api"
import type { NestingPiece } from "../engine/types"
import type { AxiosRequestConfig } from "axios"

export type CadParseResponse = {
  pieces: NestingPiece[]
  pieceCount: number
  width?: number
  height?: number
  valid: boolean
}

type ApiRequestConfig = AxiosRequestConfig & {
  skipGlobalErrorToast?: boolean
}

export const cadParseApi = {
  async parseFile(
    file: File,
    signal?: AbortSignal,
  ): Promise<CadParseResponse> {
    const form = new FormData()
    form.append("file", file, file.name)

    const config: ApiRequestConfig = {
      signal,
      timeout: 120_000,
      skipGlobalErrorToast: true,
      maxBodyLength: Infinity,
      maxContentLength: Infinity,
    }

    const res = await api.post<CadParseResponse>(
      "/engineering/cad/parse",
      form,
      config,
    )

    return res.data
  },
}