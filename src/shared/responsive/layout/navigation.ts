import {
  FolderKanban,
  ClipboardList,
  Scissors,
  FoldHorizontal,
  Wrench,
  PaintBucket,
  Package,
  Truck,
  Users,
  DraftingCompass,
  NotebookPen,
  ListChecks,
  ShieldCheck,
} from "lucide-react"

import {
  PermissionCode,
} from "@/shared/core/enums/permission-code.enum"

export const NAVIGATION = [
  {
    title: "Gestión",
    items: [
      {
        label: "Proyectos",
        href: "/projects",
        icon: FolderKanban,
        permission: PermissionCode.PROJECT_READ,
      },
      {
        label: "Tareas",
        href: "/tasks",
        icon: ClipboardList,
        permission: PermissionCode.TASK_READ,
      },
      {
        label: "Engineering",
        href: "/engineering",
        icon: DraftingCompass,
      },
    ],
  },

  {
    title: "Producción",
    items: [
      {
        label: "Corte",
        href: "/processes?code=ct",
        icon: Scissors,
        permission: PermissionCode.WORKFLOW_READ,
      },
      {
        label: "Plegado",
        href: "/processes?code=pl",
        icon: FoldHorizontal,
        permission: PermissionCode.WORKFLOW_READ,
      },
      {
        label: "Soldadura",
        href: "/processes?code=sd",
        icon: Wrench,
        permission: PermissionCode.WORKFLOW_READ,
      },
      {
        label: "Pintura",
        href: "/processes?code=pt",
        icon: PaintBucket,
        permission: PermissionCode.WORKFLOW_READ,
      },
      {
        label: "Ensamble",
        href: "/processes?code=en",
        icon: Package,
        permission: PermissionCode.WORKFLOW_READ,
      },
      {
        label: "Despacho",
        href: "/processes?code=ds",
        icon: Truck,
        permission: PermissionCode.WORKFLOW_READ,
      },
    ],
  },

  {
    title: "Bitácoras",
    items: [
      {
        label: "Bitácora de Producción",
        href: "/bitacora",
        icon: NotebookPen,
        permission: PermissionCode.ACTIVITY_LOG_READ,
        roles: ["PRODUCCION", "ADMIN"],
      },
      {
        label: "Bitácora Ingeniería",
        href: "/bitacora/ingenieria",
        icon: NotebookPen,
        permission: PermissionCode.ACTIVITY_LOG_READ,
        roles: ["INGENIERIA", "ADMIN"],
      },
      {
        label: "Bitácora del Equipo",
        href: "/bitacora/equipo",
        icon: NotebookPen,
        permission: PermissionCode.ACTIVITY_LOG_READ_ANY,
        roles: ["PROYECTOS", "ADMIN"],
      },
    ],
  },

  {
    title: "Administración",
    items: [
      {
        label: "Usuarios",
        href: "/admin/users",
        icon: Users,
        permission: PermissionCode.USER_READ,
      },
      {
        label: "Roles y Permisos",
        href: "/admin/roles",
        icon: ShieldCheck,
        permission: PermissionCode.ROLE_MANAGE,
      },
      {
        label: "Actividades",
        href: "/admin/activity-types",
        icon: ListChecks,
        permission: PermissionCode.ACTIVITY_TYPE_MANAGE,
      },
    ],
  },
] as const