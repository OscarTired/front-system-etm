"use client"

import { useQueryClient } from "@tanstack/react-query"

import { useMemo, useState } from "react"
import { ArrowLeft, Pencil, Save } from "lucide-react"
import { useSearchParams } from "next/navigation"

import { usePermissionCatalog } from "../hooks/use-permission-catalog"
import { useRolePermissions } from "../hooks/use-role-permissions"
import { useUpdateRolePermissions } from "../hooks/use-update-role-permissions"

import {
  getGroupOrder,
  getPermissionActionLabel,
  getPermissionGroupKey,
  getPermissionGroupLabel,
} from "../utils/permission-groups"

import { RolePermissionsSkeleton } from "./role-permissions-skeleton"
import { PermissionGroup } from "./permissions/permission-group"
import { PermissionsModeTabs, type PermissionsMode } from "./permissions-mode-tabs"
import { UserDialog } from "@/features/admin/users/components/dialog/user-dialog"
import { PermissionCode } from "@/shared/core/enums/permission-code.enum"
import { usePermissions } from "@/features/permissions/hooks/use-permissions"
import {
  RoleDesktopRow,
  RoleDesktopRowSkeleton,
  RoleMobileCard,
  RoleMobileSkeleton,
  UserDesktopRow,
  UserMobileCard,
} from "../table"
import { useRoles } from "../hooks/use-roles"

import { useUsers } from "@/features/users/hooks/use-users"
import { useUserBasePermissions } from "@/features/users/hooks/use-user-base-permissions"
import { useUserPermissionOverrides } from "@/features/users/hooks/use-user-permission-overrides"
import { useSaveUserPermissionOverrides } from "@/features/users/hooks/use-save-user-permission-overrides"
import type { User } from "@/features/users/types/user.types"

import { PrimaryAction } from "@/shared/ui/actions/primary-action"
import { EntityToolbar } from "@/shared/ui/entity-toolbar/entity-toolbar"
import { AppListScroll } from "@/shared/ui/vertical-scroll/app-list-scroll"
import { EntityToolbarSearch } from "@/shared/ui/entity-toolbar/entity-toolbar-search"
import { useResponsive } from "@/shared/responsive/hooks/use-responsive"
import { cn } from "@/shared/utils/utils"
import { ScrollArea } from "@/components/ui/scroll-area"

import type { Role } from "../types/role.types"

export function RolePermissionsPageContent() {
  const queryClient = useQueryClient()

  const { isMobile } = useResponsive()
  const [search, setSearch] = useState("")
  const searchParams = useSearchParams()
  const { has } = usePermissions()
  const canEditUser = has(PermissionCode.USER_UPDATE)

  const [mode, setMode] = useState<PermissionsMode>(() =>
    searchParams.get("tab") === "usuarios" ? "usuarios" : "roles",
  )
  const [editUserOpen, setEditUserOpen] = useState(false)

  const [selectedRole, setSelectedRole] = useState<Role | null>(null)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)

  const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set())
  const [dirty, setDirty] = useState(false)

  const handleModeChange = (nextMode: PermissionsMode) => {
    setMode(nextMode)
    setSearch("")
    setSelectedRole(null)
    setSelectedUser(null)
    setCheckedIds(new Set())
    setDirty(false)
  }

  const { roles, loading: loadingRoles } = useRoles(mode === "roles")
  const { users, loading: loadingUsers } = useUsers()
  const { permissions: catalog, loading: loadingCatalog } = usePermissionCatalog()

  // ---- Modo ROLES ----
  const { permissions: rolePermissions, loading: loadingRolePermissions } = useRolePermissions(
    mode === "roles" ? selectedRole?.id ?? null : null
  )
  const { updatePermissions, saving: savingRole } = useUpdateRolePermissions(selectedRole?.id ?? null)

  // ---- Modo USUARIOS ----
  const { basePermissionIds, loading: loadingBasePermissions } = useUserBasePermissions(
    mode === "usuarios" ? selectedUser : null
  )
  const { overrides, loading: loadingOverrides } = useUserPermissionOverrides(
    mode === "usuarios" ? selectedUser?.id ?? null : null
  )
  const { save: saveUserOverrides, saving: savingOverrides } = useSaveUserPermissionOverrides(
    selectedUser?.id ?? null
  )

  const [loadedForRoleId, setLoadedForRoleId] = useState<string | null>(null)
  const [loadedForUserId, setLoadedForUserId] = useState<string | null>(null)

  if (
    mode === "roles" &&
    selectedRole &&
    !loadingRolePermissions &&
    loadedForRoleId !== selectedRole.id
  ) {
    setLoadedForRoleId(selectedRole.id)
    setCheckedIds(new Set(rolePermissions.map((p) => p.id)))
    setDirty(false)
  }

  if (mode === "roles" && !selectedRole && loadedForRoleId !== null) {
    setLoadedForRoleId(null)
  }

  const userDataLoading = loadingBasePermissions || loadingOverrides

  if (
    mode === "usuarios" &&
    selectedUser &&
    !userDataLoading &&
    loadedForUserId !== selectedUser.id
  ) {
    setLoadedForUserId(selectedUser.id)

    const initial = new Set(basePermissionIds)
    for (const override of overrides) {
      if (override.effect === "ALLOW") initial.add(override.permission.id)
      else initial.delete(override.permission.id)
    }

    setCheckedIds(initial)
    setDirty(false)
  }

  if (mode === "usuarios" && !selectedUser && loadedForUserId !== null) {
    setLoadedForUserId(null)
  }

  const filteredRoles = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) return roles
    return roles.filter((role) => role.name.toLowerCase().includes(query))
  }, [roles, search])

  const filteredUsers = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) return users
    return users.filter((user) => user.name.toLowerCase().includes(query))
  }, [users, search])

  const grouped = useMemo(() => {
    const groups = new Map<string, typeof catalog>()
    for (const permission of catalog) {
      const key = getPermissionGroupKey(permission.code)
      groups.set(key, [...(groups.get(key) ?? []), permission])
    }
    return Array.from(groups.entries()).sort(
      ([a], [b]) => getGroupOrder(a) - getGroupOrder(b)
    )
  }, [catalog])

  const overriddenIds = useMemo(() => {
    if (mode !== "usuarios") return undefined

    const ids = new Set<string>()
    for (const permission of catalog) {
      const checked = checkedIds.has(permission.id)
      const base = basePermissionIds.has(permission.id)
      if (checked !== base) ids.add(permission.id)
    }
    return ids
  }, [mode, catalog, checkedIds, basePermissionIds])

  const handleToggle = (permissionId: string) => {
    setCheckedIds((current) => {
      const next = new Set(current)
      if (next.has(permissionId)) next.delete(permissionId)
      else next.add(permissionId)
      return next
    })
    setDirty(true)
  }

  const handleToggleAll = (permissionIds: string[], nextChecked: boolean) => {
    setCheckedIds((current) => {
      const next = new Set(current)
      for (const id of permissionIds) {
        if (nextChecked) next.add(id)
        else next.delete(id)
      }
      return next
    })
    setDirty(true)
  }

  const handleSave = async () => {
    if (mode === "roles") {
      await updatePermissions(Array.from(checkedIds))
    } else if (selectedUser) {
      await saveUserOverrides({
        checkedIds,
        basePermissionIds,
        existingOverrides: overrides,
      })
    }
    setDirty(false)
  }

  const permissionsLoading =
    mode === "roles"
      ? loadingCatalog || loadingRolePermissions
      : loadingCatalog || userDataLoading

  const saving = mode === "roles" ? savingRole : savingOverrides
  const saveLabel = "Guardar"

  const selectedName = mode === "roles" ? selectedRole?.name : selectedUser?.name
  const selectedColor = mode === "roles" ? selectedRole?.color : selectedUser?.color
  const hasSelection = mode === "roles" ? !!selectedRole : !!selectedUser

  const showLeftPanel = !isMobile || !hasSelection
  const showPermissionsPanel = !isMobile || hasSelection

  // Antes vivía como hermano fijo antes de AppListScroll: en mobile
  // el slot de contenido es absolute inset-0 (detrás del TopBar
  // flotante), y solo AppListScroll compensa con paddingTop
  // (TOP_BAR_HEIGHT_PX) — por eso quedaba tapado en reposo, igual que
  // en Usuarios. Ahora se manda como primer hijo de cada
  // AppListScroll; para desktop se sigue mostrando afuera, ya que ahí
  // no hay TopBar flotante.
  const searchToolbar = (
    <div className="mb-1 shrink-0">
      <EntityToolbar
        left={
          <div className="flex flex-wrap items-center gap-2 py-1">
            <EntityToolbarSearch value={search} onChange={setSearch} />
          </div>
        }
        right={<PermissionsModeTabs mode={mode} onChange={handleModeChange} />}
      />
    </div>
  )

  return (
    <div
      className={cn(
        "flex h-full min-h-0 w-full flex-col",
        isMobile ? "" : "overflow-hidden",
      )}
    >
      {!isMobile && searchToolbar}

      <div
        className={cn(
          "flex min-h-0 flex-1 gap-4",
          isMobile ? "flex-col" : "overflow-hidden"
        )}
      >
        {/* PANEL IZQUIERDO: ROLES o USUARIOS */}
        {showLeftPanel && isMobile && (
          <AppListScroll
            onRefresh={async () => {
              await queryClient.invalidateQueries({ queryKey: ["roles"] })
            }}
          >
            {searchToolbar}
            <div className="space-y-3 pb-4">
              {mode === "roles" ? (
                <>
                  {loadingRoles && <RoleMobileSkeleton />}

                  {!loadingRoles && filteredRoles.length === 0 && (
                    <div className="rounded-2xl bg-foreground/5 px-4 py-8 text-center text-sm text-muted-foreground">
                      {search ? "Ningún rol coincide con la búsqueda." : "No hay roles todavía."}
                    </div>
                  )}

                  {!loadingRoles &&
                    filteredRoles.map((role, index) => (
                      <RoleMobileCard
                        key={role.id}
                        role={role}
                        index={index}
                        onSelect={() => setSelectedRole(role)}
                      />
                    ))}
                </>
              ) : (
                <>
                  {loadingUsers && <RoleMobileSkeleton />}

                  {!loadingUsers && filteredUsers.length === 0 && (
                    <div className="rounded-2xl bg-foreground/5 px-4 py-8 text-center text-sm text-muted-foreground">
                      {search ? "Ningún usuario coincide con la búsqueda." : "No hay usuarios todavía."}
                    </div>
                  )}

                  {!loadingUsers &&
                    filteredUsers.map((user, index) => (
                      <UserMobileCard
                        key={user.id}
                        user={user}
                        index={index}
                        onSelect={() => setSelectedUser(user)}
                      />
                    ))}
                </>
              )}
            </div>
          </AppListScroll>
        )}

        {showLeftPanel && !isMobile && (
          <aside className="flex h-full w-72 shrink-0 flex-col overflow-hidden rounded-2xl bg-foreground/5">
            <div className="shrink-0 px-4 py-3">
              <p className="truncate text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                {mode === "roles" ? "Roles" : "Usuarios"}
              </p>
            </div>

            <ScrollArea
              data-entity-table-scroll
              className="min-h-0 min-w-0 flex-1 p-1.5"
            >
              <div className="flex flex-col gap-2.5">
                {mode === "roles" ? (
                  <>
                    {loadingRoles && <RoleDesktopRowSkeleton />}

                    {!loadingRoles && filteredRoles.length === 0 && (
                      <p className="px-3 py-6 text-center text-sm text-muted-foreground">
                        {search ? "Ningún rol coincide con la búsqueda." : "No hay roles todavía."}
                      </p>
                    )}

                    {!loadingRoles &&
                      filteredRoles.map((role) => (
                        <RoleDesktopRow
                          key={role.id}
                          role={role}
                          selected={selectedRole?.id === role.id}
                          onSelect={() => setSelectedRole(role)}
                        />
                      ))}
                  </>
                ) : (
                  <>
                    {loadingUsers && <RoleDesktopRowSkeleton />}

                    {!loadingUsers && filteredUsers.length === 0 && (
                      <p className="px-3 py-6 text-center text-sm text-muted-foreground">
                        {search ? "Ningún usuario coincide con la búsqueda." : "No hay usuarios todavía."}
                      </p>
                    )}

                    {!loadingUsers &&
                      filteredUsers.map((user) => (
                        <UserDesktopRow
                          key={user.id}
                          user={user}
                          selected={selectedUser?.id === user.id}
                          onSelect={() => setSelectedUser(user)}
                        />
                      ))}
                  </>
                )}
              </div>

            </ScrollArea>
          </aside>
        )}

        {/* PANEL PERMISOS */}
        {showPermissionsPanel && isMobile && (
          <AppListScroll
            className="p-1.5"
            onRefresh={async () => {
              await queryClient.invalidateQueries({ queryKey: ["roles"] })
            }}
          >
            <header className="mb-1 flex shrink-0 items-start justify-between gap-4">
              <div className="flex min-w-0 items-center gap-3">
                {hasSelection && (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedRole(null)
                      setSelectedUser(null)
                    }}
                    className="flex size-8 shrink-0 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-foreground/10 hover:text-foreground"
                  >
                    <ArrowLeft size={16} />
                  </button>
                )}

                {hasSelection && (
                  <div className="min-w-0">
                    <p className="truncate text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                      {mode === "roles" ? "Permisos" : "Excepciones"}
                    </p>
                    {/* Cambiado a flex-col o flex-wrap controlado para acomodar el estado */}
                    <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
                      <div className="flex min-w-0 items-center gap-2">
                        <span
                          className="size-2.5 shrink-0 rounded-full"
                          style={{ backgroundColor: selectedColor || "var(--muted-foreground)" }}
                        />
                        <span className="truncate text-sm font-medium text-foreground">
                          {selectedName}
                        </span>
                      </div>
                      {dirty && (
                        <span className="shrink-0 text-xs font-medium text-amber-400">
                          Cambios sin guardar
                        </span>
                      )}
                    </div>
                    {mode === "usuarios" && (
                      <p className="mt-1 text-xs text-muted-foreground">
                        Por usuario
                      </p>
                    )}
                  </div>
                )}
              </div>

              {mode === "usuarios" && selectedUser && canEditUser && (
                <button
                  type="button"
                  onClick={() => setEditUserOpen(true)}
                  className="flex size-9 shrink-0 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-foreground/10 hover:text-foreground"
                  aria-label="Editar usuario"
                  title="Editar usuario"
                >
                  <Pencil size={16} />
                </button>
              )}
              <PrimaryAction
                label={saveLabel}
                icon={Save}
                isLoading={saving}
                onClick={handleSave}
                disabled={!hasSelection || !dirty || saving}
              />
            </header>

            {hasSelection && permissionsLoading && <RolePermissionsSkeleton />}

            {hasSelection && !permissionsLoading && (
              <div className="flex flex-col gap-4 pb-4">
                {grouped.map(([groupKey, groupPermissions]) => (
                  <PermissionGroup
                    key={groupKey}
                    title={getPermissionGroupLabel(groupKey)}
                    permissions={groupPermissions}
                    checkedIds={checkedIds}
                    onToggle={handleToggle}
                    onToggleAll={handleToggleAll}
                    overriddenIds={overriddenIds}
                    getLabel={(permission) =>
                      getPermissionActionLabel(permission.code, groupKey)
                    }
                  />
                ))}
              </div>
            )}
          </AppListScroll>
        )}

        {showPermissionsPanel && !isMobile && (
          <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl bg-foreground/5">
            {!hasSelection ? (
              <div className="flex h-full w-full items-center justify-center bg-transparent">
                <div className="text-center">
                  <p className="text-base font-medium text-muted-foreground">
                    {mode === "roles" ? "Ningún rol seleccionado" : "Ningún usuario seleccionado"}
                  </p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {mode === "roles"
                      ? "Seleccione un rol"
                      : "Gestione las excepciones"}
                  </p>
                </div>
              </div>
            ) : (
              <>
                <header className="flex shrink-0 items-start justify-between gap-4 px-5 py-4">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                      {mode === "roles" ? "Permisos" : "Excepciones"}
                    </p>
                    {/* Cambiado a flex-wrap para que se mueva fluidamente o baje si falta espacio */}
                    <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
                      <div className="flex min-w-0 items-center gap-2">
                        <span
                          className="size-2.5 shrink-0 rounded-full"
                          style={{ backgroundColor: selectedColor || "var(--muted-foreground)" }}
                        />
                        <span className="truncate text-sm font-medium text-foreground">
                          {selectedName}
                        </span>
                      </div>
                      {dirty && (
                        <span className="shrink-0 text-xs font-medium text-amber-400">
                          Cambios sin guardar
                        </span>
                      )}
                    </div>
                    {mode === "usuarios" && (
                      <p className="mt-1 text-xs text-muted-foreground">
                        Por encima de lo que ya otorgan sus roles. Lo marcado como{" "}
                        <span className="text-amber-400">Excepción</span> es distinto a su base.
                      </p>
                    )}
                  </div>

              {mode === "usuarios" && selectedUser && canEditUser && (
                <button
                  type="button"
                  onClick={() => setEditUserOpen(true)}
                  className="flex size-10 shrink-0 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-foreground/10 hover:text-foreground"
                  aria-label="Editar usuario"
                  title="Editar usuario"
                >
                  <Pencil size={16} />
                </button>
              )}
                  <PrimaryAction
                    label={saveLabel}
                    icon={Save}
                    isLoading={saving}
                    onClick={handleSave}
                    disabled={!dirty || saving}
                  />
                </header>

                <ScrollArea
                  data-entity-table-scroll
                  className="min-h-0 min-w-0 flex-1 p-1.5"
                >
                  {permissionsLoading && <RolePermissionsSkeleton />}

                  {!permissionsLoading && (
                    <div className="flex flex-col gap-4">
                      {grouped.map(([groupKey, groupPermissions]) => (
                        <PermissionGroup
                          key={groupKey}
                          title={getPermissionGroupLabel(groupKey)}
                          permissions={groupPermissions}
                          checkedIds={checkedIds}
                          onToggle={handleToggle}
                          onToggleAll={handleToggleAll}
                          overriddenIds={overriddenIds}
                          getLabel={(permission) =>
                            getPermissionActionLabel(permission.code, groupKey)
                          }
                        />
                      ))}
                    </div>
                  )}

                </ScrollArea>
              </>
            )}
          </section>
        )}
      </div>

      {editUserOpen && selectedUser && (
        <UserDialog
          open={editUserOpen}
          user={selectedUser}
          onClose={() => setEditUserOpen(false)}
        />
      )}
    </div>
  )
}