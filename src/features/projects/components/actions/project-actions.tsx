"use client"

import {
  useState,
} from "react"

import {
  Plus,
} from "lucide-react"

import {
  PermissionCode,
} from "@/shared/core/enums/permission-code.enum"

import {
  usePermissions,
} from "@/features/permissions/hooks/use-permissions"

import {
  PrimaryAction,
} from "@/shared/ui/actions/primary-action"

import {
  FabTrigger,
} from "@/shared/ui/speed-dial-fab/fab-trigger"

import {
  ProjectDialog,
} from "../dialog/project-dialog"

function useCreateProjectDialog(){

  const [open, setOpen] = useState(false)

  const { has } = usePermissions()

  const canCreate = has(PermissionCode.PROJECT_CREATE)

  function handleOpen(){

    if(!canCreate){
      return
    }

    setOpen(true)

  }

  const dialog = open && (

    <ProjectDialog
      open={open}
      onClose={() => setOpen(false)}
    />

  )

  return { canCreate, handleOpen, dialog }

}

/**
 * Desktop: botón normal en el header (PrimaryAction). En mobile no
 * renderiza nada — ahí "Nuevo proyecto" vive DENTRO del FAB (ver
 * ProjectCreateDialAction más abajo), no como un botón flotante
 * separado.
 */
export function ProjectActions(){

  const { canCreate, handleOpen, dialog } = useCreateProjectDialog()

  return (

    <>

      <PrimaryAction
        label="Nuevo proyecto"
        icon={Plus}
        disabled={!canCreate}
        onClick={handleOpen}
      />

      {dialog}

    </>

  )

}

/**
 * Pensado para ir DENTRO del array `actions` de AdaptiveActionBar
 * (mobile) — mismo criterio que TaskCreateDialAction.
 */
export function ProjectCreateDialAction(){

  const { canCreate, handleOpen, dialog } = useCreateProjectDialog()

  return (

    <>

      <FabTrigger
        icon={Plus}
        label="NUEVO PROYECTO"
        disabled={!canCreate}
        onClick={handleOpen}
        accentClassName="bg-cyan-600 text-black"
        className={!canCreate ? "cursor-not-allowed opacity-40" : undefined}
      />

      {dialog}

    </>

  )

}