"use client"

import { useState } from "react"
import { Plus } from "lucide-react"

import { PrimaryAction } from "@/shared/ui/actions/primary-action"
import { useResponsive } from "@/shared/responsive/hooks/use-responsive"
import { cn } from "@/shared/utils/utils"

import { PermissionCode } from "@/shared/core/enums/permission-code.enum"
import { usePermissions } from "@/features/permissions/hooks/use-permissions"

import { ActivityPickerDialog } from "../dialogs/activity-picker-dialog"

import type { ActivityDepartment } from "../../types/activity-log.types"

type Props = {
  department?: ActivityDepartment
}

// Mismo patrón que ProjectActions/TaskActions/UserActions/
// ActivityTypeActions: vive en el header de la página, dueño de su
// propio diálogo — desacoplado del contenido (que además abre este
// mismo diálogo al tocar "+ Registrar qué hiciste" dentro de una
// franja vacía; cada uno maneja su propia instancia, es liviano y
// evita pasar estado de la página al contenido y viceversa).
export function ActivityLogActions({
  department = "PRODUCCION",
}: Props = {}) {

  const [open, setOpen] = useState(false)

  const { isMobile } = useResponsive()

  const { has } = usePermissions()
  const canCreate = has(PermissionCode.ACTIVITY_LOG_CREATE)

  return (

    <>

      {isMobile ? (

        <button
          type="button"
          disabled={!canCreate}
          onClick={() => {
            if (!canCreate) return
            setOpen(true)
          }}
          aria-label="Registrar actividad"
          className={cn(
            "fixed bottom-22 right-4 z-30 flex size-12 items-center justify-center rounded-full transition duration-200",
            canCreate
              ? "bg-white text-black hover:scale-105 hover:bg-neutral-100 active:scale-95"
              : "cursor-not-allowed bg-foreground/20 text-foreground/40",
            "shadow-[0_12px_32px_rgba(0,0,0,0.55),0_4px_10px_rgba(255,255,255,0.08)]",
          )}
        >
          <Plus size={20} strokeWidth={2.5} />
        </button>

      ) : (

        <PrimaryAction
          label="Registrar"
          icon={Plus}
          disabled={!canCreate}
          onClick={() => setOpen(true)}
        />

      )}

      <ActivityPickerDialog
        open={canCreate && open}
        department={department}
        onOpenChange={setOpen}
      />

    </>

  )

}