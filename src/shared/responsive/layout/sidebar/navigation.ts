import {
  FolderKanban,
  ClipboardList,
  UserCog,
  Scissors,
  FoldHorizontal,
  Wrench,
  PaintBucket,
  Package,
  Truck,
  NotebookPen,
  ListChecks,
  Boxes,
  DraftingCompass,
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
    title: "Registros",
    items: [
      {
        label: "Bitácora",
        href: "/bitacora",
        icon: NotebookPen,
        permission: PermissionCode.ACTIVITY_LOG_READ,
      },
    ],
  },

  {
    title: "Ingeniería",
    items: [
      {
        label: "Nesting",
        href: "/nesting",
        icon: Boxes,
        //permission: PermissionCode.NESTING_READ,
      },
      {
        label: "CAD · Placa",
        href: "/cad/plate",
        icon: DraftingCompass,
      },
    ],
  },
  
  {
    title: "Administración",
    items: [
      {
        // Antes: Usuarios + Roles/Permisos (misma data, dos shells).
        // Ahora un solo hub: lista roles/usuarios, permisos y edición de persona.
        label: "Acceso",
        href: "/admin/access",
        icon: UserCog,
        permissions: [
          PermissionCode.USER_READ,
          PermissionCode.ROLE_MANAGE,
        ],
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