"use client"

import dynamic from "next/dynamic"
import { createPortal } from "react-dom"
import { X } from "lucide-react"
import type { CadRow } from "./piece-list"
import type { NestingPieceInput } from "../../engineering/components/dxf-canvas"

const DxfCanvas = dynamic(
  () => import("@/features/engineering/components/dxf-canvas").then((m) => m.DxfCanvas),
  { ssr: false }
)

export interface PiecePreviewDialogProps {
  row: CadRow | null
  onClose: () => void
}

export function PiecePreviewDialog({ row, onClose }: PiecePreviewDialogProps) {
  if (!row || typeof document === "undefined") return null

  const pieces: NestingPieceInput[] = [
    {
      subOutlines: row.subEntities.length
        ? row.subEntities.map((s) => ({ points: s.outline.points, color: s.color }))
        : [],
      outline: row.outline.points,
    },
  ]

  const modal = (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm" onClick={onClose}>
      <div
        className="flex h-[75vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-[#101012] shadow-2xl ring-1 ring-white/10"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex shrink-0 items-center justify-between border-b border-white/5 px-5 py-4">
          <h3 className="text-sm font-semibold text-white">{row.fileName}</h3>
          <button onClick={onClose} className="rounded-lg p-2 text-neutral-400 hover:bg-white/5 hover:text-white">
            <X size={16} />
          </button>
        </div>
        <div className="relative min-h-0 flex-1">
          {/* Sin sheetSize: la pieza se ve sola, sin la plancha de fondo. */}
          <DxfCanvas pieces={pieces} selectedPieceIndex={null} />
        </div>
      </div>
    </div>
  )

  return createPortal(modal, document.body)
}