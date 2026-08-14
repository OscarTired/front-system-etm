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
  footerStart?: React.ReactNode
  children: React.ReactNode
  onClose: () => void
  onSave: () => void
}

/**
 * Shell alineado a ExportDialog:
 * header fijo → body ScrollArea único → footer fijo.
 * Desktop: h 85vh. Mobile: max-h-dvh (forms wizard).
 */
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
  footerStart,
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
          "flex flex-col gap-0 overflow-hidden rounded-2xl p-0 text-foreground shadow-2xl",
          isMobile
            ? "max-h-dvh w-180 max-w-180 bg-popover"
            : // Mismo contrato que ExportDialog; un poco más ancho por campos de form
              "h-[85vh] max-h-[85vh] w-full max-w-2xl bg-popover",
        )}
      >
        <div className="shrink-0">
          <FormDialogHeader title={title} icon={icon} />
        </div>

        {subHeader && (
          <div className="shrink-0 px-5 py-2">{subHeader}</div>
        )}

        {/* Única fuente de scroll — igual que ExportDialog */}
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
            start={footerStart}
          />
        </div>
      </DialogContent>
    </Dialog>
  )
}
