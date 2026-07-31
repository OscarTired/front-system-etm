"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import type { NestedSheet, NestingOptions, NestingPiece } from "../engine/types";
import type { NestingWorkerRequest, NestingWorkerResponse } from "../workers/nesting.worker";

export type NestingStatus = "idle" | "running" | "done" | "error" | "cancelled";

export interface UseNestingResult {
  status: NestingStatus;
  /** 0-1 */
  progress: number;
  sheets: NestedSheet[] | null;
  error: string | null;
  run: (pieces: NestingPiece[], options: Omit<NestingOptions, "onProgress" | "signal">) => void;
  cancel: () => void;
}

/**
 * Corre el nesting en un Web Worker dedicado (uno por componente que
 * use el hook), para no bloquear la UI mientras calcula. El worker se
 * crea una sola vez al montar y se destruye al desmontar.
 */
export function useNesting(): UseNestingResult {
  const workerRef = useRef<Worker | null>(null);
  const [status, setStatus] = useState<NestingStatus>("idle");
  const [progress, setProgress] = useState(0);
  const [sheets, setSheets] = useState<NestedSheet[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const worker = new Worker(new URL("../workers/nesting.worker.ts", import.meta.url));

    worker.onmessage = (event: MessageEvent<NestingWorkerResponse>) => {
      const msg = event.data;
      if (msg.type === "progress") {
        setProgress(msg.progress);
      } else if (msg.type === "done") {
        setSheets(msg.sheets);
        setStatus("done");
        setProgress(1);
      } else if (msg.type === "error") {
        setError(msg.message);
        setStatus("error");
      }
    };

    workerRef.current = worker;

    return () => {
      worker.terminate();
      workerRef.current = null;
    };
  }, []);

  const run = useCallback(
    (pieces: NestingPiece[], options: Omit<NestingOptions, "onProgress" | "signal">) => {
      setStatus("running");
      setProgress(0);
      setSheets(null);
      setError(null);

      const request: NestingWorkerRequest = { type: "run", pieces, options };
      workerRef.current?.postMessage(request);
    },
    []
  );

  const cancel = useCallback(() => {
    const request: NestingWorkerRequest = { type: "cancel" };
    workerRef.current?.postMessage(request);
    setStatus("cancelled");
  }, []);

  return { status, progress, sheets, error, run, cancel };
}
