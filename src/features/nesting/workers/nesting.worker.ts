import { optimize } from "../engine/optimize";
import type { NestedSheet, NestingOptions, NestingPiece } from "../engine/types";

export type NestingWorkerRequest =
  | { type: "run"; pieces: NestingPiece[]; options: Omit<NestingOptions, "onProgress" | "signal"> }
  | { type: "cancel" };

export type NestingWorkerResponse =
  | { type: "progress"; progress: number }
  | { type: "done"; sheets: NestedSheet[] }
  | { type: "error"; message: string };

/**
 * Tipado mínimo del scope del worker. A propósito NO usamos
 * `/// <reference lib="webworker" />`: esa lib de TypeScript declara
 * globals (como `self`) incompatibles con la lib "dom" que ya usa el
 * resto del proyecto, y cargarlas juntas en el mismo tsconfig rompe la
 * compilación. Como solo necesitamos `onmessage`/`postMessage`,
 * declaramos justo eso y hacemos un cast puntual.
 */
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

    try {
      const sheets = optimize(msg.pieces, {
        ...msg.options,
        signal: cancelSignal,
        onProgress: (progress) => {
          ctx.postMessage({ type: "progress", progress });
        },
      });

      ctx.postMessage({ type: "done", sheets });
    } catch (err) {
      ctx.postMessage({
        type: "error",
        message: err instanceof Error ? err.message : "Error desconocido en el nesting",
      });
    }
  }
};

export {};
