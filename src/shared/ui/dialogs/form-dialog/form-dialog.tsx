"use client"

import type {
  LucideIcon,
} from "lucide-react"

import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog"

import {
  FormDialogHeader,
} from "./form-dialog-header"

import {
  FormDialogFooter,
} from "./form-dialog-footer"

import { ScrollArea } from "@/components/ui/scroll-area"

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

  const handleOpenChange = (
    value: boolean
  ) => {

    if (saving) {
      return
    }

    if (!value) {
      onClose()
    }

  }

  return (

    <Dialog
      open={open}
      onOpenChange={handleOpenChange}
    >

      <DialogContent
        size="large"
        className="flex max-h-dvh w-180 max-w-180 flex-col overflow-hidden rounded-2xl bg-[#171717] p-0 text-white shadow-2xl"
      >

        <FormDialogHeader
          title={title}
          icon={icon}
        />

        {subHeader && (

          <div className="shrink-0 px-5 py-3">

            {subHeader}

          </div>

        )}

        <ScrollArea className="flex min-h-0 flex-1 flex-col">

          <div className="px-5 py-4">
            {children}
          </div>

        </ScrollArea>

        <div className="px-5 py-4">

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