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
  cn,
} from "@/shared/utils/utils"

import {
  PrimaryAction,
} from "@/shared/ui/actions/primary-action"

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

      <button
        type="button"
        disabled={!canCreate}
        onClick={handleOpen}
        aria-label="Nuevo proyecto"
        className={cn(
          "flex items-center gap-2",
          !canCreate && "cursor-not-allowed opacity-40",
        )}
      >
        <Plus size={14} strokeWidth={2.4} />
        NUEVO PROYECTO
      </button>

      {dialog}

    </>

  )

}