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
  TaskDialog,
} from "../dialog/task-dialog"

function useCreateTaskDialog(){

  const [open, setOpen] = useState(false)

  const { has } = usePermissions()

  const canCreate = has(PermissionCode.TASK_CREATE)

  function handleOpen(){

    if(!canCreate){
      return
    }

    setOpen(true)

  }

  const dialog = open && (

    <TaskDialog
      open={open}
      promptOpenAfterCreate
      onClose={() => setOpen(false)}
    />

  )

  return { canCreate, handleOpen, dialog }

}

/**
 * Desktop: botón normal en el header (PrimaryAction). En mobile no
 * renderiza nada — ahí "Nueva tarea" vive DENTRO del FAB (ver
 * TaskCreateDialAction más abajo), no como un botón flotante
 * separado.
 */
export function TaskActions(){

  const { canCreate, handleOpen, dialog } = useCreateTaskDialog()

  return (

    <>

      <PrimaryAction
        label="Nueva tarea"
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
 * (mobile) — un ítem más del mismo FAB de Filtro/Orden/Historial/
 * Exportar, con el mismo look de pastilla (SpeedDialFab se encarga
 * del estilo vía [&_button]). El bloqueo por permisos vive en este
 * botón puntual, no en el FAB entero.
 */
export function TaskCreateDialAction(){

  const { canCreate, handleOpen, dialog } = useCreateTaskDialog()

  return (

    <>

      <FabTrigger
        icon={Plus}
        label="NUEVA TAREA"
        disabled={!canCreate}
        onClick={handleOpen}
        accentClassName="bg-cyan-600 text-black"
        className={!canCreate ? "cursor-not-allowed opacity-40" : undefined}
      />

      {dialog}

    </>

  )

}