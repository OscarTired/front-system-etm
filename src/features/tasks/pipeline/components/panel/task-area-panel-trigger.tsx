"use client"

import { useEffect, useState } from "react"
import { usePathname, useSearchParams } from "next/navigation"
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

  const pathname = usePathname()
  const searchParams = useSearchParams()

  // Si el panel queda abierto y la ruta cambia, este componente se
  // desmonta de golpe con el Sheet todavía "abierto" — la limpieza
  // normal de Radix (bloqueo de scroll del body, animación de
  // salida, etc.) no llega a correr, y eso es justo lo que se ve
  // como "el panel que quiere salir" al cambiar de página. Mismo
  // mecanismo que ya usa SidebarDrawer con closeDrawer(): cerrar
  // explícito ANTES de que la navegación desmonte el árbol, para
  // que el cierre pase por su transición normal.
  useEffect(() => {

    // Reset intencional al cambiar de ruta (ver comentario arriba),
    // no una derivación de estado que debería vivir en el render.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setOpen(false)

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, searchParams.toString()])

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