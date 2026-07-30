import type { LucideIcon } from "lucide-react"
import { UserCog, FolderKanban, ClipboardList, NotebookPen } from "lucide-react"

type BottomNavAction =
  | { type: "link"; href: string }
  | { type: "sidebar" }

export type BottomNavItem = {
  label: string
  icon: LucideIcon
  action: BottomNavAction
  // Puede ser más de un prefijo — "Asignación" tiene que quedar
  // activo tanto en /production (la ruta, sin cambiar — solo cambió
  // el contenido) como en cualquiera de las rutas independientes de
  // proceso (/processes?code=ct para Corte, ?code=pl para Plegado,
  // etc.), que antes no matcheaban con nada y el chip activo
  // desaparecía al entrar a esas pantallas.
  matchPrefix: string | string[]
}

export const BOTTOM_NAV_ITEMS: BottomNavItem[] = [
  {
    label: "Proyectos",
    icon: FolderKanban,
    action: { type: "link", href: "/projects" },
    matchPrefix: "/projects",
  },
  {
    label: "Tareas",
    icon: ClipboardList,
    action: { type: "link", href: "/tasks" },
    matchPrefix: "/tasks",
  },
  {
    // Antes "Producción" abría el ProductionHub (un listado de las
    // 6 áreas para elegir cuál mirar) — se sacó del todo. La ruta
    // /production ahora es la pantalla de Asignación (antes vivía
    // metida en TaskAreaPanel, el sheet "Mis tareas" — ver el
    // comentario en esa página para el porqué del cambio).
    label: "Asignación",
    icon: UserCog,
    action: { type: "link", href: "/production" },
    matchPrefix: ["/production", "/processes"],
  },
  {
    // Antes: "Menú", abría el sidebar (acción "sidebar"). Ya se
    // puede abrir el mismo sidebar desde el ☰ del TopBar, así que
    // no se pierde ese acceso — este lugar pasa a ser la Bitácora.
    label: "Bitácora",
    icon: NotebookPen,
    action: { type: "link", href: "/bitacora" },
    matchPrefix: "/bitacora",
  },
]