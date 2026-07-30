import type { LucideIcon } from "lucide-react"
import { UserCog, FolderKanban, ClipboardList, NotebookPen } from "lucide-react"

type BottomNavAction =
  | { type: "link"; href: string }
  | { type: "sidebar" }

export type BottomNavItem = {
  label: string
  icon: LucideIcon
  action: BottomNavAction
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

    label: "Asignación",
    icon: UserCog,
    action: { type: "link", href: "/production" },
    matchPrefix: "/production",
  },
  {

    label: "Bitácora",
    icon: NotebookPen,
    action: { type: "link", href: "/bitacora" },
    matchPrefix: "/bitacora",
  },
]