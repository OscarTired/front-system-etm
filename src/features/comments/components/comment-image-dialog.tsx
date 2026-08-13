"use client"

import { ExternalLink } from "lucide-react"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

type Props = {
  imageUrl: string | null
  onClose: () => void
}

/**
 * Vista de foto adjunta — mismo patrón de diálogo con header
 * que el resto de la app (no imagen suelta a pantalla completa).
 */
export function CommentImageDialog({ imageUrl, onClose }: Props) {
  return (
    <Dialog
      open={!!imageUrl}
      onOpenChange={open => {
        if (!open) onClose()
      }}
    >
      <DialogContent
        size="large"
        className="flex max-h-[90dvh] flex-col gap-0 overflow-hidden p-0 sm:max-w-lg"
      >
        <DialogHeader className="shrink-0 border-b border-border px-5 py-4">
          <DialogTitle>Foto adjunta</DialogTitle>
        </DialogHeader>

        {imageUrl && (
          <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-5 py-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imageUrl}
              alt="Foto adjunta"
              className="mx-auto max-h-[min(70dvh,32rem)] w-full rounded-xl object-contain bg-muted"
            />
            <a
              href={imageUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex shrink-0 items-center justify-center gap-2 rounded-xl bg-foreground/5 px-4 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-foreground/10 hover:text-foreground"
            >
              <ExternalLink size={15} />
              Abrir original
            </a>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
