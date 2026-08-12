"use client"

import { useState } from "react"
import { Plus } from "lucide-react"

import { PrimaryAction } from "@/shared/ui/actions/primary-action"
import { useResponsive } from "@/shared/responsive/hooks/use-responsive"
import { cn } from "@/shared/utils/utils"

import { PermissionCode } from "@/shared/core/enums/permission-code.enum"
import { usePermissions } from "@/features/permissions/hooks/use-permissions"

import { ActivityTypeFormDialog } from "../dialogs/activity-type-form-dialog"

// Mismo patrón que ProjectActions/TaskActions/UserActions: vive en
// el header de la página (no adentro del listado), dueño de su
// propio diálogo de "crear" — desacoplado del contenido, que
// maneja sus propios diálogos de editar/eliminar por ítem. Antes
// este botón vivía DENTRO de ActivityTypesPageContent, como parte
// del flujo scrolleable — por eso la página no calzaba con el
// layout de Proyectos/Tareas/Usuarios (título + acción en la misma
// fila del header, en vez de la acción mezclada con la lista).
export function ActivityTypeActions() {

  const [open, setOpen] = useState(false)

  const { isMobile } = useResponsive()

  const { has } = usePermissions()
  const canManage = has(PermissionCode.ACTIVITY_TYPE_MANAGE)

  return (

    <>

      {isMobile ? (

        <button
          type="button"
          disabled={!canManage}
          onClick={() => {
            if (!canManage) return
            setOpen(true)
          }}
          aria-label="Nueva actividad"
          className={cn(
            "fixed bottom-22 right-4 z-30 flex size-12 items-center justify-center rounded-full transition duration-200",
            canManage
              ? "bg-white text-black hover:scale-105 hover:bg-neutral-100 active:scale-95"
              : "cursor-not-allowed bg-white/20 text-white/40",
            "shadow-[0_12px_32px_rgba(0,0,0,0.55),0_4px_10px_rgba(255,255,255,0.08)]",
          )}
        >
          <Plus size={20} strokeWidth={2.5} />
        </button>

      ) : (

        <PrimaryAction
          label="Nueva actividad"
          icon={Plus}
          disabled={!canManage}
          onClick={() => setOpen(true)}
        />

      )}

      <ActivityTypeFormDialog
        open={canManage && open}
        onOpenChange={setOpen}
        editingType={null}
      />

    </>

  )

}