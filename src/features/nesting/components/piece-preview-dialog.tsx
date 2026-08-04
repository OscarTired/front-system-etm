"use client"

import dynamic from "next/dynamic"
import { RotateCw, FlipHorizontal, FlipVertical, X } from "lucide-react"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

import type { CadRow } from "./piece-list"
import type { NestingPieceInput } from "./dxf-canvas"

const DxfCanvas = dynamic(
  () => import("@/features/nesting/components/dxf-canvas").then((m) => m.DxfCanvas),
  { ssr: false }
)

export interface PiecePreviewDialogProps {
  row: CadRow | null
  onClose: () => void
  onRotate?: (id: string, degrees: number) => void
  onMirrorX?: (id: string) => void
  onMirrorY?: (id: string) => void
}

export function PiecePreviewDialog({
  row,
  onClose,
  onRotate,
  onMirrorX,
  onMirrorY,
}: PiecePreviewDialogProps) {
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
        className="flex h-[75vh] w-full max-w-3xl flex-col gap-0 overflow-hidden p-0 [&>button]:hidden"
      >
        <DialogHeader className="flex flex-row items-center justify-between shrink-0 px-5 py-3 border-b border-white/10 gap-4">
          <div className="min-w-0 flex-1">
            <DialogTitle className="text-sm font-semibold text-white truncate">
              {row?.fileName ?? ""}
            </DialogTitle>
          </div>

          {/* Botonera de transformación (Rotar y Espejos) */}
          {row && (
            <div className="flex items-center gap-1 shrink-0 pl-2">
              <Button
                size="icon-sm"
                variant="ghost"
                className="h-7 w-7 text-neutral-400 hover:text-white hover:bg-white/10"
                onClick={() => onRotate?.(row.id, 90)}
                title="Rotar 90°"
              >
                <RotateCw className="h-3.5 w-3.5" />
              </Button>
              <Button
                size="icon-sm"
                variant="ghost"
                className="h-7 w-7 text-neutral-400 hover:text-white hover:bg-white/10"
                onClick={() => onMirrorX?.(row.id)}
                title="Espejo horizontal"
              >
                <FlipHorizontal className="h-3.5 w-3.5" />
              </Button>
              <Button
                size="icon-sm"
                variant="ghost"
                className="h-7 w-7 text-neutral-400 hover:text-white hover:bg-white/10"
                onClick={() => onMirrorY?.(row.id)}
                title="Espejo vertical"
              >
                <FlipVertical className="h-3.5 w-3.5" />
              </Button>

              <div className="h-4 w-px bg-white/10 mx-0.5" />

              <Button
                size="icon-sm"
                variant="ghost"
                className="h-7 w-7 text-neutral-400 hover:text-white hover:bg-white/10"
                onClick={onClose}
                title="Cerrar"
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
          )}
        </DialogHeader>

        <div className="relative min-h-0 flex-1">
          <DxfCanvas pieces={pieces} />
        </div>
      </DialogContent>
    </Dialog>
  )
}