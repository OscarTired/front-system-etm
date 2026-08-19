"use client"

import { useState } from "react"
import { Plus } from "lucide-react"

import { PermissionCode } from "@/shared/core/enums/permission-code.enum"
import { usePermissions } from "@/features/permissions/hooks/use-permissions"
import { PrimaryAction } from "@/shared/ui/actions/primary-action"
import { FabTrigger } from "@/shared/ui/speed-dial-fab/fab-trigger"

import { EngineeringTaskDialog } from "./engineering-task-dialog"

function useCreateEngineeringDialog() {
  const [open, setOpen] = useState(false)
  const { has } = usePermissions()
  const canCreate = has(PermissionCode.TASK_CREATE)

  function handleOpen() {
    if (!canCreate) return
    setOpen(true)
  }

  const dialog = open ? (
    <EngineeringTaskDialog open={open} onClose={() => setOpen(false)} />
  ) : null

  return { canCreate, handleOpen, dialog }
}

/** Desktop header — igual que TaskActions */
export function EngineeringActions() {
  const { canCreate, handleOpen, dialog } = useCreateEngineeringDialog()
  return (
    <>
      <PrimaryAction
        label="Nueva tarea"
        icon={Plus}
        disabled={!canCreate}
        onClick={handleOpen}
        iconOnly
      />
      {dialog}
    </>
  )
}

/** Ítem del FAB mobile */
export function EngineeringCreateDialAction() {
  const { canCreate, handleOpen, dialog } = useCreateEngineeringDialog()
  return (
    <>
      <FabTrigger
        icon={Plus}
        label="NUEVA TAREA"
        disabled={!canCreate}
        onClick={handleOpen}
        accentClassName="bg-primary text-primary-foreground"
      />
      {dialog}
    </>
  )
}
