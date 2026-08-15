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
  durationMs?: number
}

export type NestJobRecord = {
  id: string
  status: "queued" | "running" | "done" | "error" | "cancelled"
  progress: number
  error?: string
  result?: NestRunResponse
}

export const nestingRunApi = {
  /** Sync (compat). */
  async run(body: NestRunRequest, signal?: AbortSignal) {
    const res = await api.post<NestRunResponse>("/engineering/nest", body, {
      signal,
      timeout: 120_000,
    })
    return res.data
  },

  async createJob(body: NestRunRequest, signal?: AbortSignal) {
    const res = await api.post<NestJobRecord>("/engineering/nest/jobs", body, {
      signal,
      timeout: 30_000,
    })
    return res.data
  },

  async getJob(id: string, signal?: AbortSignal) {
    const res = await api.get<NestJobRecord>(`/engineering/nest/jobs/${id}`, {
      signal,
      timeout: 15_000,
    })
    return res.data
  },

  async cancelJob(id: string) {
    const res = await api.post<NestJobRecord>(
      `/engineering/nest/jobs/${id}/cancel`,
    )
    return res.data
  },

  /**
   * Poll hasta done/error/cancelled.
   * onProgress 0–1.
   */
  async runViaJob(
    body: NestRunRequest,
    opts?: {
      signal?: AbortSignal
      onProgress?: (p: number) => void
      intervalMs?: number
    },
  ): Promise<NestRunResponse> {
    const job = await this.createJob(body, opts?.signal)
    const interval = opts?.intervalMs ?? 200
    for (;;) {
      if (opts?.signal?.aborted) {
        await this.cancelJob(job.id).catch(() => undefined)
        throw new DOMException("Aborted", "AbortError")
      }
      const cur = await this.getJob(job.id, opts?.signal)
      opts?.onProgress?.(cur.progress)
      if (cur.status === "done" && cur.result) return cur.result
      if (cur.status === "error") {
        throw new Error(cur.error ?? "Nesting job failed")
      }
      if (cur.status === "cancelled") {
        throw new DOMException("Aborted", "AbortError")
      }
      await new Promise((r) => setTimeout(r, interval))
    }
  },
}
