"use client"

import { useEffect, useMemo, useState } from "react"
import { ArrowLeft, Plus, Trash2 } from "lucide-react"

import { PermissionCode } from "@/shared/core/enums/permission-code.enum"
import { usePermissions } from "@/features/permissions/hooks/use-permissions"
import { useRoles } from "@/features/roles/hooks/use-roles"
import { useAreas } from "@/features/areas/hooks/use-areas"
import { useResponsive } from "@/shared/responsive/hooks/use-responsive"
import { PrimaryAction } from "@/shared/ui/actions/primary-action"
import { ActionDialog } from "@/shared/ui/dialogs/action-dialog/action-dialog"
import { EntityToolbar } from "@/shared/ui/entity-toolbar/entity-toolbar"
import { EntityToolbarSearch } from "@/shared/ui/entity-toolbar/entity-toolbar-search"
import { cn } from "@/shared/utils/utils"
import type { EntityIcon } from "@/shared/constants/entity-icons"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"

import { useUserMutations } from "@/features/users/hooks/use-user-mutations"
import { useUsers } from "@/features/users/hooks/use-users"
import { validateUser } from "../hooks/validate-user"
import { UserMobileCard } from "./cards/user-mobile-card"
import { UserMobileSkeleton } from "./cards/user-mobile-skeleton"
import { UserDesktopRow } from "./user-desktop-row"
import { UserDesktopRowSkeleton } from "./user-desktop-row-skeleton"
import { UserForm } from "./form/user-form"
import { UserDialog } from "./dialog/user-dialog"

import { generateUserDefaultsFromEmail } from "@/features/users/utils/generate-user-defaults-from-email"
import { isLevelAllowedForRoles } from "@/features/users/utils/allowed-levels-for-roles"

import {
  RoleDesktopRow,
  RoleDesktopRowSkeleton,
  RoleMobileCard,
  RoleMobileSkeleton,
} from "@/features/roles/table"
import type { Role } from "@/features/roles/types/role.types"

type UserFormData = {
  name: string
  username: string
  email: string
  password: string
  confirmPassword: string
  isChangingPassword: boolean
  roleIds: string[]
  level: "GENERAL" | "OPERARIO" | "SUPERVISOR" | null
  areaIds: string[]
  icon: EntityIcon
  color: string
  active: boolean
}

export function UsersPageContent() {
  const { isMobile } = useResponsive()
  const { users, loading } = useUsers()
  const { roles, loading: loadingRoles } = useRoles()
  const { createUser, updateUser, deleteUser } = useUserMutations()
  const { has } = usePermissions()

  const canCreate = has(PermissionCode.USER_CREATE)
  const canUpdate = has(PermissionCode.USER_UPDATE)
  const canDelete = has(PermissionCode.USER_DELETE)

  const [search, setSearch] = useState("")

  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null)
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [mobileCreateOpen, setMobileCreateOpen] = useState(false)

  const [formData, setFormData] = useState<UserFormData>({
    name: "",
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    isChangingPassword: false,
    roleIds: [],
    level: null,
    areaIds: [],
    icon: "user",
    color: "#7C3AED",
    active: true,
  })

  const [attempted, setAttempted] = useState(false)

  const selectedRole = useMemo(
    () => roles.find(r => r.id === selectedRoleId) ?? null,
    [roles, selectedRoleId],
  )

  const filteredRoles = useMemo(() => {
    const q = search.trim().toLowerCase()
    return roles.filter(r => !q || r.name.toLowerCase().includes(q))
  }, [roles, search])

  const usersInSelectedRole = useMemo(() => {
    if (!selectedRoleId) return []
    return users.filter(u => u.roles.some(r => r.id === selectedRoleId))
  }, [users, selectedRoleId])

  const filteredUsersInRole = useMemo(() => {
    const q = search.trim().toLowerCase()
    return usersInSelectedRole.filter(
      u =>
        !q ||
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        (u.username ?? "").toLowerCase().includes(q),
    )
  }, [usersInSelectedRole, search])

  const selectedUser = useMemo(
    () => users.find(u => u.id === selectedUserId),
    [users, selectedUserId],
  )

  // Gateado: /areas exige MASTER_DATA_READ, que no todos los roles
  // tienen (ej. Administración) — sin este enabled, cualquiera que
  // entre a Usuarios dispara esta query enseguida y le sale
  // "Insufficient permissions" sin haber tocado nada todavía.
  const { areas } = useAreas(isCreating || !!selectedUser)

  useEffect(() => {
    if (isCreating || !selectedUser) return

    setFormData({
      name: selectedUser.name,
      username: selectedUser.username ?? "",
      email: selectedUser.email,
      password: "",
      confirmPassword: "",
      isChangingPassword: false,
      roleIds: selectedUser.roles?.map(r => r.id) ?? [],
      level: selectedUser.level ?? null,
      areaIds: selectedUser.areas?.map(a => a.id) ?? [],
      icon: (selectedUser.icon as EntityIcon) ?? "user",
      color: selectedUser.color ?? "#7C3AED",
      active: selectedUser.active,
    })
    setAttempted(false)
  }, [selectedUser, isCreating])

  const errors = validateUser({
    name: formData.name,
    username: formData.username,
    email: formData.email,
    password: formData.password,
    confirmPassword: formData.confirmPassword,
    roleIds: formData.roleIds,
    isEditing: !isCreating,
    isChangingPassword: formData.isChangingPassword,
  })

  const isValid = Object.keys(errors).length === 0
  const isSaving = createUser.isPending || updateUser.isPending

  const handleSelectRole = (role: Role) => {
    setSelectedRoleId(role.id)
    setSelectedUserId(null)
    setIsCreating(false)
    setSearch("")
  }

  const handleBackToRoles = () => {
    setSelectedRoleId(null)
    setSelectedUserId(null)
    setIsCreating(false)
    setSearch("")
  }

  const handleSelectUser = (userId: string) => {
    setIsCreating(false)
    setSelectedUserId(userId)
  }

  const handleStartCreate = () => {
    if (!selectedRoleId) return

    if (isMobile) {
      setMobileCreateOpen(true)
      return
    }

    setIsCreating(true)
    setSelectedUserId(null)
    setFormData({
      name: "",
      username: "",
      email: "",
      password: "",
      confirmPassword: "",
      isChangingPassword: true,
      roleIds: selectedRoleId ? [selectedRoleId] : [],
      level: null,
      areaIds: [],
      icon: "user",
      color: "#7C3AED",
      active: true,
    })
    setAttempted(false)
  }

  const handleSave = async () => {
    if (!isValid) {
      setAttempted(true)
      return
    }

    const payload = {
      name: formData.name,
      username: formData.username,
      email: formData.email,
      roleIds: formData.roleIds,
      level: formData.level,
      areaIds: formData.areaIds,
      icon: formData.icon,
      color: formData.color,
      active: formData.active,
      ...(formData.password.trim() && { password: formData.password }),
    }

    if (isCreating) {
      const res = await createUser.mutateAsync(payload)
      setIsCreating(false)
      if (res?.id) setSelectedUserId(res.id)
    } else if (selectedUserId) {
      await updateUser.mutateAsync({ id: selectedUserId, dto: payload })
    }
  }

  const handleDelete = async () => {
    if (!selectedUserId) return
    await deleteUser.mutateAsync(selectedUserId)
    setDeleteOpen(false)
    setSelectedUserId(null)
  }

  const selectedFormRoles = roles.filter(r => formData.roleIds.includes(r.id))
  const showRightPanel = isCreating || !!selectedUserId

  return (
    <div
      className={cn(
        "mx-auto flex w-full max-w-400 flex-col",
        isMobile ? "" : "h-full min-h-0 overflow-hidden",
      )}
    >
      <div className="shrink-0">
        <EntityToolbar
          left={
            <div className="flex flex-wrap items-center gap-2 py-1">
              <EntityToolbarSearch value={search} onChange={setSearch} />
            </div>
          }
        />
      </div>

      <div
        className={cn(
          "flex min-h-0 flex-1 gap-4",
          isMobile ? "flex-col" : "overflow-hidden",
        )}
      >
        {isMobile && (
          <div className="flex min-h-0 flex-1 flex-col gap-4">
            {!selectedRole && (
              // pb-28: mismo motivo que el resto — reserva espacio
              // para que el último rol no quede tapado por el
              // bottom nav.
              <div className="space-y-3 pb-28">
                {loadingRoles ? (
                  <RoleMobileSkeleton />
                ) : filteredRoles.length === 0 ? (
                  <div className="rounded-2xl bg-[#101012] px-4 py-8 text-center text-sm text-neutral-500">
                    {search ? "Ningún rol coincide con la búsqueda." : "No hay roles todavía."}
                  </div>
                ) : (
                  filteredRoles.map((role, index) => (
                    <RoleMobileCard
                      key={role.id}
                      role={role}
                      index={index}
                      onSelect={() => handleSelectRole(role)}
                    />
                  ))
                )}
              </div>
            )}

            {selectedRole && (
              <>
                <header className="flex shrink-0 items-center gap-3">
                  <button
                    type="button"
                    onClick={handleBackToRoles}
                    className="flex size-8 shrink-0 items-center justify-center rounded-xl text-neutral-400 transition-colors hover:bg-white/8 hover:text-white"
                  >
                    <ArrowLeft size={16} />
                  </button>
                  <div className="min-w-0">
                    <p className="truncate text-xs font-semibold uppercase tracking-[0.18em] text-neutral-500">
                      Usuarios
                    </p>
                    <div className="mt-1 flex items-center gap-2">
                      <span
                        className="size-2.5 shrink-0 rounded-full"
                        style={{ backgroundColor: selectedRole.color || "#71717a" }}
                      />
                      <span className="truncate text-sm font-medium text-white">
                        {selectedRole.name}
                      </span>
                    </div>
                  </div>
                  {canCreate && (
                    <button
                      type="button"
                      onClick={handleStartCreate}
                      className="ml-auto flex size-9 items-center justify-center rounded-xl bg-white/8 text-white transition-colors hover:bg-white/14"
                    >
                      <Plus size={16} />
                    </button>
                  )}
                </header>

                {/* Plano, sin ScrollArea acá: mismo bug que tenía
                    role-permissions-page-content.tsx — en mobile el
                    root de la página no define un alto fijo, así
                    que ScrollArea calculaba un alto ambiguo y
                    recortaba su propio viewport contra el bottom
                    nav, sin importar el padding de adentro. */}
                <div className="min-h-0 flex-1 p-1.5">
                  {/* pb-28: reserva espacio para que el último
                      usuario no quede tapado por el bottom nav. */}
                  <div className="space-y-3 pb-28">
                    {loading ? (
                      <UserMobileSkeleton />
                    ) : filteredUsersInRole.length === 0 ? (
                      <p className="px-3 py-6 text-center text-sm text-neutral-500">
                        {search
                          ? "Ningún usuario coincide con la búsqueda."
                          : "Este rol todavía no tiene usuarios."}
                      </p>
                    ) : (
                      filteredUsersInRole.map((u, i) => (
                        <UserMobileCard
                          key={u.id}
                          user={u}
                          index={i}
                          expanded={selectedUserId === u.id}
                          onToggle={() =>
                            setSelectedUserId(curr => (curr === u.id ? null : u.id))
                          }
                        />
                      ))
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {!isMobile && (
          <div className="flex min-h-0 flex-1 gap-4 overflow-hidden">
            <aside className="flex h-full w-72 shrink-0 flex-col overflow-hidden rounded-2xl bg-white/3">
              {!selectedRole ? (
                <>
                  <div className="shrink-0 px-4 py-3">
                    <p className="truncate text-xs font-semibold uppercase tracking-[0.18em] text-neutral-500">
                      Roles
                    </p>
                  </div>

                  <ScrollArea
                    data-entity-table-scroll
                    className="min-h-0 flex-1 p-1.5"
                  >
                    <div className="flex flex-col gap-2.5">
                      {loadingRoles ? (
                        <RoleDesktopRowSkeleton />
                      ) : filteredRoles.length === 0 ? (
                        <p className="px-3 py-6 text-center text-sm text-neutral-500">
                          {search ? "Ningún rol coincide con la búsqueda." : "No hay roles todavía."}
                        </p>
                      ) : (
                        filteredRoles.map(role => (
                          <RoleDesktopRow
                            key={role.id}
                            role={role}
                            selected={false}
                            onSelect={() => handleSelectRole(role)}
                          />
                        ))
                      )}
                    </div>
                    <ScrollBar className="w-1.5 bg-transparent hover:bg-white/5" />
                  </ScrollArea>
                </>
              ) : (
                <>
                  <div className="flex shrink-0 items-center gap-2 px-3 py-3">
                    <button
                      type="button"
                      onClick={handleBackToRoles}
                      className="flex size-8 shrink-0 items-center justify-center rounded-xl text-neutral-400 transition-colors hover:bg-white/8 hover:text-white"
                    >
                      <ArrowLeft size={16} />
                    </button>
                    <div className="min-w-0">
                      <p className="truncate text-xs font-semibold uppercase tracking-[0.18em] text-neutral-500">
                        Usuarios
                      </p>
                      <div className="mt-0.5 flex items-center gap-2">
                        <span
                          className="size-2 shrink-0 rounded-full"
                          style={{ backgroundColor: selectedRole.color || "#71717a" }}
                        />
                        <span className="truncate text-xs font-medium text-neutral-300">
                          {selectedRole.name}
                        </span>
                      </div>
                    </div>
                    {canCreate && (
                      <button
                        type="button"
                        onClick={handleStartCreate}
                        className="ml-auto flex size-8 shrink-0 items-center justify-center rounded-xl bg-white/8 text-white transition-colors hover:bg-white/14"
                      >
                        <Plus size={16} />
                      </button>
                    )}
                  </div>

                  <ScrollArea
                    data-entity-table-scroll
                    className="min-h-0 flex-1 p-1.5"
                  >
                    <div className="flex flex-col gap-2.5">
                      {loading ? (
                        <UserDesktopRowSkeleton />
                      ) : filteredUsersInRole.length === 0 ? (
                        <p className="px-3 py-6 text-center text-sm text-neutral-500">
                          {search
                            ? "Ningún usuario coincide con la búsqueda."
                            : "Este rol todavía no tiene usuarios."}
                        </p>
                      ) : (
                        filteredUsersInRole.map(u => (
                          <UserDesktopRow
                            key={u.id}
                            user={u}
                            selected={!isCreating && selectedUserId === u.id}
                            onSelect={() => handleSelectUser(u.id)}
                          />
                        ))
                      )}
                    </div>
                    <ScrollBar className="w-1.5 bg-transparent hover:bg-white/5" />
                  </ScrollArea>
                </>
              )}
            </aside>

            <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl bg-white/3">
              {!showRightPanel ? (
                <div className="flex h-full w-full items-center justify-center bg-transparent">
                  <div className="text-center">
                    <p className="text-base font-medium text-neutral-300">
                      {selectedRole ? "Ningún usuario seleccionado" : "Ningún rol seleccionado"}
                    </p>
                    <p className="mt-2 text-sm text-neutral-500">
                      {selectedRole
                        ? "Elegí un usuario desde el panel izquierdo para ver o editar sus datos."
                        : "Elegí un rol desde el panel izquierdo para ver sus usuarios."}
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  <header className="flex shrink-0 items-start justify-between gap-4 px-5 py-4">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-xs font-semibold uppercase tracking-[0.18em] text-neutral-500">
                          {isCreating ? "Nuevo usuario" : "Usuario"}
                        </p>
                        <div className="mt-1 flex items-center gap-2.5">
                          <div className="flex items-center gap-2">
                            <span
                              className="size-2.5 shrink-0 rounded-full"
                              style={{ backgroundColor: formData.color || "#71717a" }}
                            />
                            <span className="truncate text-sm font-medium text-white">
                              {isCreating
                                ? "Asigná credenciales y permisos"
                                : selectedUser?.name || "Detalle del usuario"}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex shrink-0 items-center gap-3">
                      {!isCreating && canDelete && selectedUserId && (
                        <button
                          type="button"
                          onClick={() => setDeleteOpen(true)}
                          className="flex size-9 items-center justify-center rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}

                      <PrimaryAction
                        label={
                          isCreating
                            ? "Crear usuario"
                            : "Guardar"
                        }
                        isLoading={isSaving}
                        disabled={!canUpdate || isSaving}
                        onClick={handleSave}
                      />
                    </div>
                  </header>

                  <ScrollArea
                    data-entity-table-scroll
                    className="min-h-0 flex-1 p-5"
                  >
                    <UserForm
                      name={formData.name}
                      username={formData.username}
                      email={formData.email}
                      password={formData.password}
                      confirmPassword={formData.confirmPassword}
                      isEditing={!isCreating}
                      isChangingPassword={formData.isChangingPassword}
                      icon={formData.icon}
                      color={formData.color}
                      roles={roles}
                      selectedRoles={selectedFormRoles}
                      level={formData.level}
                      areas={areas.filter(a => formData.areaIds.includes(a.id))}
                      errors={attempted ? errors : undefined}
                      onRolesChange={nextRoles => {
                        const levelStillValid =
                          isLevelAllowedForRoles(formData.level, nextRoles)

                        const stillProduccion =
                          nextRoles.some(r => r.code === "PRODUCCION")

                        setFormData(c => ({
                          ...c,
                          roleIds: nextRoles.map(r => r.id),
                          ...(!levelStillValid && { level: null, areaIds: [] }),
                          ...(levelStillValid
                            && (c.level !== "OPERARIO" || !stillProduccion)
                            && { areaIds: [] }),
                        }))
                      }}
                      onLevelChange={level => setFormData(c => ({
                        ...c,
                        level,
                        // Mismo criterio que en UserDialog/backend: el
                        // área solo aplica a OPERARIO.
                        ...(level !== "OPERARIO" && { areaIds: [] }),
                      }))}
                      onAreasChange={nextAreas => setFormData(c => ({ ...c, areaIds: nextAreas.map(a => a.id) }))}
                      onChangingPasswordChange={val =>
                        setFormData(c => ({ ...c, isChangingPassword: val }))
                      }
                      onNameChange={val => setFormData(c => ({ ...c, name: val }))}
                      onUsernameChange={val =>
                        setFormData(c => ({ ...c, username: val }))
                      }
                      onEmailChange={val => {

                        if (isCreating) {

                          const defaults = generateUserDefaultsFromEmail(val)

                          setFormData(c => ({
                            ...c,
                            email: val,
                            name: defaults.name,
                            username: defaults.username,
                            password: defaults.password,
                            confirmPassword: defaults.confirmPassword,
                          }))

                        } else {

                          setFormData(c => ({ ...c, email: val }))

                        }

                      }}
                      onPasswordChange={val =>
                        setFormData(c => ({ ...c, password: val }))
                      }
                      onConfirmPasswordChange={val =>
                        setFormData(c => ({ ...c, confirmPassword: val }))
                      }
                      onColorChange={val => setFormData(c => ({ ...c, color: val }))}
                    />
                    <ScrollBar className="w-1.5 bg-transparent hover:bg-white/5" />
                  </ScrollArea>
                </>
              )}
            </section>
          </div>
        )}
      </div>

      {isMobile && (
        <UserDialog
          open={mobileCreateOpen}
          onClose={() => setMobileCreateOpen(false)}
        />
      )}

      <ActionDialog
        open={deleteOpen}
        title="Eliminar usuario"
        description={`Se eliminará "${selectedUser?.name}". Esta acción no se puede deshacer.`}
        confirmLabel="Eliminar"
        submittingLabel="Eliminando..."
        variant="danger"
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDelete}
      />
    </div>
  )
}