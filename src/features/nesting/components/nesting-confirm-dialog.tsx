"use client"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

export interface NestingConfirmDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  confirmLabel?: string
  cancelLabel?: string
  destructive?: boolean
  onConfirm: () => void
  secondaryLabel?: string
  onSecondary?: () => void
}

export function NestingConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  destructive = false,
  onConfirm,
  secondaryLabel,
  onSecondary,
}: NestingConfirmDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[calc(100vw-2rem)] rounded-2xl border-white/10 bg-neutral-900 p-5 text-white shadow-2xl sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold text-white">{title}</DialogTitle>
          <DialogDescription className="pt-2 text-sm leading-relaxed text-neutral-400">
            {description}
          </DialogDescription>
        </DialogHeader>
        <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="ghost"
            className="text-neutral-300 hover:bg-white/5 hover:text-white"
            onClick={() => onOpenChange(false)}
          >
            {cancelLabel}
          </Button>
          {secondaryLabel && onSecondary && (
            <Button
              type="button"
              variant="outline"
              className="border-white/15 bg-transparent text-neutral-200 hover:bg-white/5"
              onClick={() => {
                onSecondary()
                onOpenChange(false)
              }}
            >
              {secondaryLabel}
            </Button>
          )}
          <Button
            type="button"
            className={
              destructive
                ? "bg-red-600 text-white hover:bg-red-500"
                : "bg-cyan-600 text-white hover:bg-cyan-500"
            }
            onClick={() => {
              onConfirm()
              onOpenChange(false)
            }}
          >
            {confirmLabel}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
