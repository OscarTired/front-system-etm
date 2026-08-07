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
  restoreSheets: (sheets: NestedSheet[] | null) => void;
  clearSheets: () => void;
}

/**
 * Worker síncrono: el mensaje "cancel" NO se procesa mientras optimize()
 * bloquea el event loop del worker. Por eso cancel = terminate + recrear.
 * Cada run lleva un generation id para ignorar resultados tardíos.
 */
export function useNesting(): UseNestingResult {
  const workerRef = useRef<Worker | null>(null);
  const genRef = useRef(0);
  const prevSheetsRef = useRef<NestedSheet[] | null>(null);
  const sheetsRef = useRef<NestedSheet[] | null>(null);
  const [status, setStatus] = useState<NestingStatus>("idle");
  const [progress, setProgress] = useState(0);
  const [sheets, setSheets] = useState<NestedSheet[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    sheetsRef.current = sheets;
  }, [sheets]);

  const bindWorker = useCallback((worker: Worker) => {
    worker.onmessage = (event: MessageEvent<NestingWorkerResponse & { gen?: number }>) => {
      const msg = event.data;
      // Ignorar mensajes de una generación ya cancelada/reemplazada
      if (typeof msg.gen === "number" && msg.gen !== genRef.current) return;

      if (msg.type === "progress") {
        setProgress(msg.progress);
      } else if (msg.type === "done") {
        setSheets(msg.sheets);
        setStatus("done");
        setProgress(1);
      } else if (msg.type === "cancelled") {
        setSheets(msg.sheets.length > 0 ? msg.sheets : null);
        setStatus("cancelled");
      } else if (msg.type === "error") {
        setError(msg.message);
        setStatus("error");
      }
    };

    worker.onerror = (ev) => {
      setError(ev.message || "Error en el worker de nesting");
      setStatus("error");
    };
  }, []);

  const spawnWorker = useCallback(() => {
    const worker = new Worker(new URL("../workers/nesting.worker.ts", import.meta.url));
    bindWorker(worker);
    workerRef.current = worker;
    return worker;
  }, [bindWorker]);

  useEffect(() => {
    spawnWorker();
    return () => {
      workerRef.current?.terminate();
      workerRef.current = null;
    };
  }, [spawnWorker]);

  /** Mata el worker en curso (CPU deja de calcular) y abre uno limpio. */
  const killAndRespawn = useCallback(() => {
    genRef.current += 1;
    try {
      workerRef.current?.terminate();
    } catch {
      /* ignore */
    }
    workerRef.current = null;
    spawnWorker();
  }, [spawnWorker]);

  const run = useCallback(
    (pieces: NestingPiece[], options: Omit<NestingOptions, "onProgress" | "signal">) => {
      // Si había un precise colgado, matarlo antes de arrancar (fast u otro).
      killAndRespawn();
      const gen = genRef.current;

      prevSheetsRef.current = sheetsRef.current;
      setStatus("running");
      setProgress(0);
      setSheets(null);
      setError(null);

      const request: NestingWorkerRequest & { gen?: number } = {
        type: "run",
        pieces,
        options,
        gen,
      };
      workerRef.current?.postMessage(request);
    },
    [killAndRespawn],
  );

  const cancel = useCallback(() => {
    // terminate = para YA el precise en background (postMessage cancel no alcanza).
    killAndRespawn();
    setSheets(prevSheetsRef.current);
    setStatus(prevSheetsRef.current ? "done" : "cancelled");
    setProgress(prevSheetsRef.current ? 1 : 0);
  }, [killAndRespawn]);

  const restoreSheets = useCallback((next: NestedSheet[] | null) => {
    const cleaned = next ? next.filter((s) => s.pieces.length > 0) : null;
    const final = cleaned && cleaned.length > 0 ? cleaned : null;
    setSheets(final);
    setStatus(final ? "done" : "idle");
    setProgress(final ? 1 : 0);
    setError(null);
  }, []);

  const clearSheets = useCallback(() => {
    setSheets(null);
    setStatus("idle");
    setProgress(0);
    setError(null);
  }, []);

  return { status, progress, sheets, error, run, cancel, restoreSheets, clearSheets };
}
