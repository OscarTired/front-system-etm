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

      <button
        type="button"
        disabled={!canCreate}
        onClick={handleOpen}
        aria-label="Nueva tarea"
        className={cn(
          "flex items-center gap-2",
          !canCreate && "cursor-not-allowed opacity-40",
        )}
      >
        <Plus size={14} strokeWidth={2.4} />
        NUEVA TAREA
      </button>

      {dialog}

    </>

  )

}