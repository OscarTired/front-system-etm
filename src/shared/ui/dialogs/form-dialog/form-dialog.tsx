"use client"

import type { LucideIcon } from "lucide-react"

import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useResponsive } from "@/shared/responsive/hooks/use-responsive"
import { cn } from "@/shared/utils/utils"

import { FormDialogHeader } from "./form-dialog-header"
import { FormDialogFooter } from "./form-dialog-footer"

type Props = {
  open: boolean
  title: string
  icon: LucideIcon
  canSave: boolean
  saving?: boolean
  saveLabel?: string
  savingLabel?: string
  cancelLabel?: string
  onCancelClick?: () => void
  subHeader?: React.ReactNode
  children: React.ReactNode
  onClose: () => void
  onSave: () => void
}

export function FormDialog({
  open,
  title,
  icon,
  canSave,
  saving = false,
  saveLabel,
  savingLabel,
  cancelLabel,
  onCancelClick,
  subHeader,
  children,
  onClose,
  onSave,
}: Props) {
  const { isMobile } = useResponsive()

  const handleOpenChange = (value: boolean) => {
    if (saving) return
    if (!value) onClose()
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        size="large"
        className={cn(
          "flex w-180 max-w-180 flex-col gap-0 overflow-hidden rounded-2xl bg-popover p-0 text-foreground shadow-2xl",
          // Desktop: casi el mismo shell que ExportDialog (altura fija + body scrolleable)
          isMobile
            ? "max-h-dvh"
            : "h-[min(85vh,52rem)] max-h-[85vh]",
        )}
      >
        <div className="shrink-0">
          <FormDialogHeader title={title} icon={icon} />
        </div>

        {subHeader && (
          <div className="shrink-0 px-5 py-3">{subHeader}</div>
        )}

        <div className="relative min-h-0 w-full flex-1 overflow-hidden">
          <ScrollArea className="h-full w-full">
            <div
              className={cn(
                "flex flex-col px-5 pb-5",
                isMobile ? "gap-0 py-4" : "gap-5 pt-3",
              )}
            >
              {children}
            </div>
          </ScrollArea>
        </div>

        <div className="shrink-0 border-t border-border/40 px-5 py-4">
          <FormDialogFooter
            canSave={canSave}
            saving={saving}
            saveLabel={saveLabel}
            savingLabel={savingLabel}
            cancelLabel={cancelLabel}
            onCancel={onCancelClick ?? onClose}
            onSave={onSave}
          />
        </div>
      </DialogContent>
    </Dialog>
  )
}
