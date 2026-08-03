"use client"

import dynamic from "next/dynamic"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

import type { CadRow } from "./piece-list"
import type { NestingPieceInput } from "./dxf-canvas"

const DxfCanvas = dynamic(
  () => import("@/features/nesting/components/dxf-canvas").then((m) => m.DxfCanvas),
  { ssr: false }
)

export interface PiecePreviewDialogProps {
  row: CadRow | null
  onClose: () => void
}

export function PiecePreviewDialog({ row, onClose }: PiecePreviewDialogProps) {
  const pieces: NestingPieceInput[] = row
    ? [
        {
          subOutlines: row.subEntities.length
            ? row.subEntities.map((s) => ({ points: s.outline.points, color: s.color }))
            : [],
          outline: row.outline.points,
        },
      ]
    : []

  return (
    <Dialog open={row !== null} onOpenChange={(next) => !next && onClose()}>
      <DialogContent
        size="large"
        className="flex h-[75vh] w-full max-w-3xl flex-col gap-0 overflow-hidden p-0"
      >
        <DialogHeader className="shrink-0 px-5 py-4">
          <DialogTitle className="text-sm font-semibold text-white">{row?.fileName ?? ""}</DialogTitle>
        </DialogHeader>

        <div className="relative min-h-0 flex-1">
          {/* Sin sheetSize: la pieza se ve sola, sin la plancha de fondo. */}
          <DxfCanvas pieces={pieces} selectedPieceIndex={null} />
        </div>
      </DialogContent>
    </Dialog>
  )
}