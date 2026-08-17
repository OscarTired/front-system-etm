"use client"

import { PROJECT_MANAGER_ROLE_CODES } from "@/shared/core/constants/department-roles"

import {
  RoleMultiSelect,
} from "@/features/roles/components/role-multi-select"

import {
  LevelSelect,
} from "./level-select"

import {
  AreaMultiSelect,
} from "@/features/areas/components/area-multi-select"

import type {
  Area,
} from "@/features/areas/types/area.types"

import {
  DynamicBadge,
} from "@/shared/ui/badge/dynamic-badge"

import type {
  Role,
} from "@/features/roles/types/role.types"

import type {
  EntityIcon,
} from "@/shared/constants/entity-icons"

type Props = {
  name: string
  username: string
  email: string
  color: string
  icon: EntityIcon
  roles: Role[]
  selectedRoles: Role[]
  level: "GENERAL" | "OPERARIO" | "SUPERVISOR" | null
  areas: Area[]
  error?: string
  onRolesChange: (
    roles: Role[],
  ) => void
  onLevelChange: (
    level: "GENERAL" | "OPERARIO" | "SUPERVISOR" | null,
  ) => void
  onAreasChange: (
    areas: Area[],
  ) => void
}

export function UserDialogHeader({
  name,
  username,
  email,
  color,
  icon,
  roles,
  selectedRoles,
  level,
  areas,
  error,
  onRolesChange,
  onLevelChange,
  onAreasChange,
}: Props) {
  const isProduccion =
    selectedRoles.some(role => role.code === "PRODUCCION")

  // Ingeniería y Proyectos todavía no tienen sub-niveles propios
  // como Producción (sin Operario, sin Área) — hoy lo único que
  // necesitan es poder marcar a alguien como Supervisor, para
  // diferenciar quién puede ser Project Manager (ver
  // isProjectManager en features/users/utils) de quién no. Con
  // varios roles a la vez, alcanza con que UNO sea de este tipo.
  const isPmDepartment =
    selectedRoles.some(
      role => (PROJECT_MANAGER_ROLE_CODES as readonly string[]).includes(role.code),
    )

  const showLevelSelect =
    isProduccion || isPmDepartment

  return (
    <div className="rounded-2xl bg-foreground/5 p-4 tablet:p-5">
      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-4 tablet:grid-cols-[1fr_320px] tablet:items-center tablet:gap-8">
          <DynamicBadge
            label={name || "Usuario"}
            icon={icon}
            color={color}
            width="content"
          />

          <div className="w-full">
            <RoleMultiSelect
              value={selectedRoles}
              items={roles}
              placeholder="Seleccionar roles"
              onChange={onRolesChange}
            />

            {error && (
              <p className="mt-2 text-xs text-red-400">
                {error}
              </p>
            )}
          </div>
        </div>

        {showLevelSelect && (
          <div className="w-full tablet:w-[320px]">
            <div className="mb-2 text-xs font-medium text-muted-foreground">
              {isProduccion
                ? "Sub-nivel en Producción"
                : "Sub-nivel"}
            </div>

            <LevelSelect
              value={
                level === "OPERARIO" || level === "SUPERVISOR"
                  ? level
                  : null
              }
              levels={
                isProduccion
                  ? undefined
                  : ["SUPERVISOR"]
              }
              onChange={onLevelChange}
            />
          </div>
        )}

        {isProduccion && level === "OPERARIO" && (
          <div className="w-full tablet:w-[320px]">
            <div className="mb-2 text-xs font-medium text-muted-foreground">
              Áreas
            </div>

            <AreaMultiSelect
              value={areas}
              onChange={onAreasChange}
            />
          </div>
        )}

        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span className="font-semibold text-foreground">
            {name || "Nuevo usuario"}
          </span>

          <span className="text-muted-foreground/70">
            •
          </span>

          <span className="text-muted-foreground">
            {username
              ? `@${username}`
              : "@usuario"}
          </span>

          <span className="text-muted-foreground/70">
            •
          </span>

          <span className="min-w-0 truncate text-muted-foreground">
            {email || "usuario@etmperu.com"}
          </span>
        </div>
      </div>
    </div>
  )
}