"use client"

import {
  RoleSelect,
} from "@/features/roles/components/roles-select"

import {
  LevelSelect,
} from "./level-select"

import {
  AreaSelect,
} from "@/features/areas/components/area-select"

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
  selectedRole?: Role
  level: "GENERAL" | "OPERARIO" | "SUPERVISOR" | null
  area?: Area | null
  error?: string
  onRoleChange: (
    roleId: string,
  ) => void
  onLevelChange: (
    level: "GENERAL" | "OPERARIO" | "SUPERVISOR" | null,
  ) => void
  onAreaChange: (
    areaId: string | null,
  ) => void
}

export function UserDialogHeader({
  name,
  username,
  email,
  color,
  icon,
  roles,
  selectedRole,
  level,
  area,
  error,
  onRoleChange,
  onLevelChange,
  onAreaChange,
}: Props) {
  const isProduccion =
    selectedRole?.code === "PRODUCCION"

  return (
    <div className="rounded-2xl bg-white/2 p-4 tablet:p-5">
      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-4 tablet:grid-cols-[1fr_320px] tablet:items-center tablet:gap-8">
          <DynamicBadge
            label={name || "Usuario"}
            icon={icon}
            color={color}
            width="content"
          />

          <div className="w-full">
            <RoleSelect
              value={selectedRole}
              items={roles}
              placeholder="Seleccionar rol"
              onChange={role =>
                onRoleChange(
                  role?.id ?? "",
                )
              }
            />

            {error && (
              <p className="mt-2 text-xs text-red-400">
                {error}
              </p>
            )}
          </div>
        </div>

        {isProduccion && (
          <div className="w-full tablet:w-[320px]">
            <div className="mb-2 text-xs font-medium text-neutral-500">
              Sub-nivel en Producción
            </div>

            <LevelSelect
              value={
                level === "OPERARIO" || level === "SUPERVISOR"
                  ? level
                  : null
              }
              onChange={onLevelChange}
            />
          </div>
        )}

        {isProduccion && level === "OPERARIO" && (
          <div className="w-full tablet:w-[320px]">
            <div className="mb-2 text-xs font-medium text-neutral-500">
              Área
            </div>

            <AreaSelect
              value={area}
              onChange={next => onAreaChange(next?.id ?? null)}
            />
          </div>
        )}

        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span className="font-semibold text-white">
            {name || "Nuevo usuario"}
          </span>

          <span className="text-neutral-700">
            •
          </span>

          <span className="text-neutral-500">
            {username
              ? `@${username}`
              : "@usuario"}
          </span>

          <span className="text-neutral-700">
            •
          </span>

          <span className="min-w-0 truncate text-neutral-500">
            {email || "usuario@etmperu.com"}
          </span>
        </div>
      </div>
    </div>
  )
}