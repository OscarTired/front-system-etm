"use client"

import { useEffect, useState } from "react"
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
  /** Si se pasa, cierra solo tras N segundos con contador en el botón cancelar. */
  autoDismissSeconds?: number
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
  autoDismissSeconds,
}: NestingConfirmDialogProps) {
  const [left, setLeft] = useState(autoDismissSeconds ?? 0)

  useEffect(() => {
    if (!open || !autoDismissSeconds || autoDismissSeconds <= 0) {
      setLeft(0)
      return
    }
    setLeft(autoDismissSeconds)
    const id = window.setInterval(() => {
      setLeft((s) => {
        if (s <= 1) {
          window.clearInterval(id)
          onOpenChange(false)
          return 0
        }
        return s - 1
      })
    }, 1000)
    return () => window.clearInterval(id)
  }, [open, autoDismissSeconds, onOpenChange])

  const cancelText =
    autoDismissSeconds && left > 0 ? `${cancelLabel} (${left}s)` : cancelLabel

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[calc(100vw-2rem)] rounded-2xl border-border bg-popover p-5 text-foreground shadow-2xl sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold text-foreground">{title}</DialogTitle>
          <DialogDescription className="pt-2 text-sm leading-relaxed text-muted-foreground">
            {description}
          </DialogDescription>
        </DialogHeader>
        <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="ghost"
            className="text-muted-foreground hover:bg-foreground/5 hover:text-foreground"
            onClick={() => onOpenChange(false)}
          >
            {cancelText}
          </Button>
          <Button
            type="button"
            className={
              destructive
                ? "bg-red-600 text-foreground hover:bg-red-500"
                : "bg-cyan-600 text-foreground hover:bg-cyan-500"
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
