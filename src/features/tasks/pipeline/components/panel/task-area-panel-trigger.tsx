"use client"

import { useState } from "react"
import { ListChecks } from "lucide-react"

import { useMyAreaTasks } from "../../../../areas/hooks/use-my-area-tasks"
import { TaskAreaPanel } from "./task-area-panel"

// Vive en el header de Bitácora (al lado de "Registrar") — mismo
// motivo que el resto de los *Actions: dueño de su propio panel,
// desacoplado del contenido de la página. Se devuelve null si el
// Perfil del usuario no tiene sentido para esto (no es Operario con
// área ni Supervisor) — no tiene caso mostrar un botón que abre un
// panel vacío.
export function TaskAreaPanelTrigger() {

  const [open, setOpen] = useState(false)

  const { hasAreaPanel } = useMyAreaTasks()

  if (!hasAreaPanel) {
    return null
  }

  return (

    <>

      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Mis tareas"
        className="flex h-10 items-center gap-2 rounded-xl bg-white/5 px-4 text-sm font-semibold text-neutral-200 transition-colors hover:bg-white/10"
      >

        <ListChecks size={16} />

        Mis tareas

      </button>

      <TaskAreaPanel
        open={open}
        onOpenChange={setOpen}
      />

    </>

  )

}