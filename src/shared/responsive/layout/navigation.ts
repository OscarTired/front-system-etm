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

// "permission" es opcional a propósito — un ítem sin permiso
// asociado (como Engineering, que no tiene un PermissionCode propio
// todavía) queda siempre visible. Los que sí lo tienen se filtran en
// sidebar-navigation.tsx contra los permisos reales del usuario
// logueado, en vez de mostrarse siempre sin importar el rol.
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
        label: "Bitácora Personal",
        href: "/bitacora",
        icon: NotebookPen,
        permission: PermissionCode.ACTIVITY_LOG_READ,
      },
      {
        label: "Bitácora del Equipo",
        href: "/bitacora/equipo",
        icon: NotebookPen,
        permission: PermissionCode.ACTIVITY_LOG_READ_ANY,
      },
      // A diferencia del resto: además del permiso (compartido con
      // toda la bitácora), acá se exige también el rol — es la
      // única forma de que este ítem quede oculto para cualquiera
      // que no sea de Ingeniería/Admin, sin necesitar un
      // PermissionCode nuevo solo para esto (ver
      // sidebar-navigation.tsx, que filtra por roles igual que por
      // permission). El backend hace el mismo chequeo
      // independientemente (ActivityLogService.assertEngineeringAccess).
      {
        label: "Bitácora Ingeniería",
        href: "/bitacora/ingenieria",
        icon: NotebookPen,
        permission: PermissionCode.ACTIVITY_LOG_READ,
        roles: ["INGENIERIA", "ADMIN"],
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