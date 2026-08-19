"use client"

import { useState } from "react"
import { Plus } from "lucide-react"

import { PermissionCode } from "@/shared/core/enums/permission-code.enum"
import { usePermissions } from "@/features/permissions/hooks/use-permissions"
import { PrimaryAction } from "@/shared/ui/actions/primary-action"
import { FabTrigger } from "@/shared/ui/speed-dial-fab/fab-trigger"
import { UserDialog } from "../dialog/user-dialog"

function useCreateUserDialog() {
  const [open, setOpen] = useState(false)
  const { has } = usePermissions()
  const canCreate = has(PermissionCode.USER_CREATE)

  function handleOpen() {
    if (!canCreate) return
    setOpen(true)
  }

  const dialog = open ? (
    <UserDialog open={open} onClose={() => setOpen(false)} />
  ) : null

  return { canCreate, handleOpen, dialog }
}

/**
 * Desktop: PrimaryAction en el header de ACCESO (mismo patrón que
 * "Nuevo proyecto" / "Nueva tarea").
 * Mobile: no renderiza FAB suelto aquí — usar UserCreateDialAction
 * dentro del AdaptiveActionBar si la página lo cablea; el access
 * page mantiene FAB vía este mismo componente en mobile por
 * compatibilidad con el hub actual.
 */
export function UserActions() {
  const { canCreate, handleOpen, dialog } = useCreateUserDialog()

  return (
    <>
      {/* Desktop header */}
      <div className="hidden desktop:block">
        <PrimaryAction
          label="Nuevo usuario"
          icon={Plus}
          disabled={!canCreate}
          onClick={handleOpen}
          iconOnly
        />
      </div>

      {/* Mobile FAB — mismo look que otras páginas de creación */}
      <button
        type="button"
        disabled={!canCreate}
        onClick={handleOpen}
        aria-label="Nuevo usuario"
        className={[
          "desktop:hidden fixed bottom-22 right-4 z-30 flex size-12 items-center justify-center rounded-full transition duration-200",
          canCreate
            ? "bg-foreground text-background shadow-[0_12px_32px_rgba(0,0,0,0.55),0_4px_10px_rgba(255,255,255,0.08)] hover:scale-105 hover:bg-foreground/90 active:scale-95"
            : "cursor-not-allowed bg-foreground/10 text-foreground/35 shadow-none",
        ].join(" ")}
      >
        <Plus size={20} strokeWidth={2.5} />
      </button>

      {dialog}
    </>
  )
}

/** Dial action si se integra al FAB compartido (opcional). */
export function UserCreateDialAction() {
  const { canCreate, handleOpen, dialog } = useCreateUserDialog()

  return (
    <>
      <FabTrigger
        icon={Plus}
        label="NUEVO USUARIO"
        disabled={!canCreate}
        onClick={handleOpen}
        accentClassName="bg-primary text-primary-foreground shadow-lg"
        className={!canCreate ? "cursor-not-allowed opacity-40" : undefined}
      />
      {dialog}
    </>
  )
}
