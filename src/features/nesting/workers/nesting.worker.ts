import { optimize } from "../engine/optimize";
import type { NestedSheet, NestingOptions, NestingPiece } from "../engine/types";

export type NestingWorkerRequest =
  | {
      type: "run";
      pieces: NestingPiece[];
      options: Omit<NestingOptions, "onProgress" | "signal">;
      /** Generación del cliente: se reenvía en cada respuesta. */
      gen?: number;
    }
  | { type: "cancel" };

export type NestingWorkerResponse =
  | { type: "progress"; progress: number; gen?: number }
  | { type: "done"; sheets: NestedSheet[]; gen?: number }
  | { type: "cancelled"; sheets: NestedSheet[]; gen?: number }
  | { type: "error"; message: string; gen?: number };

interface NestingWorkerScope {
  onmessage: ((event: MessageEvent<NestingWorkerRequest>) => void) | null;
  postMessage: (message: NestingWorkerResponse) => void;
}

const ctx = self as unknown as NestingWorkerScope;

const cancelSignal = { cancelled: false };

ctx.onmessage = (event) => {
  const msg = event.data;

  if (msg.type === "cancel") {
    cancelSignal.cancelled = true;
    return;
  }

  if (msg.type === "run") {
    cancelSignal.cancelled = false;
    const gen = msg.gen;

    try {
      // Log explícito del modo para depurar precise-vs-fast
      const mode = msg.options.mode ?? "fast";
      // eslint-disable-next-line no-console
      console.info(`[nesting.worker] run mode=${mode} pieces=${msg.pieces.length} gen=${gen}`);

      const sheets = optimize(msg.pieces, {
        ...msg.options,
        signal: cancelSignal,
        onProgress: (progress) => {
          ctx.postMessage({ type: "progress", progress, gen });
        },
      });

      if (cancelSignal.cancelled) {
        ctx.postMessage({ type: "cancelled", sheets, gen });
      } else {
        ctx.postMessage({ type: "done", sheets, gen });
      }
    } catch (err) {
      ctx.postMessage({
        type: "error",
        message: err instanceof Error ? err.message : "Error desconocido en el nesting",
        gen,
      });
    }
  }
};

export {};
