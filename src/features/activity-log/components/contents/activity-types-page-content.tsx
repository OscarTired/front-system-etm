"use client"

import { useQueryClient } from "@tanstack/react-query"

import { AppListScroll } from "@/shared/ui/vertical-scroll/app-list-scroll"

import { useMemo, useState } from "react"
import { Pencil, Power, Trash2 } from "lucide-react"

import { ActionDialog } from "@/shared/ui/dialogs/action-dialog/action-dialog"
import { IconAction } from "@/shared/ui/actions/icon-action"
import { EntityToolbar } from "@/shared/ui/entity-toolbar/entity-toolbar"
import { EntityToolbarSearch } from "@/shared/ui/entity-toolbar/entity-toolbar-search"

import { PermissionCode } from "@/shared/core/enums/permission-code.enum"
import { usePermissions } from "@/features/permissions/hooks/use-permissions"

import { useActivityTypes } from "../../hooks/use-activity-types"
import { useActivityTypeMutations } from "../../hooks/use-activity-type-mutations"
import { getActivityIcon } from "../../constants/activity-icons"
import { ActivityTypeFormDialog } from "../dialogs/activity-type-form-dialog"

import type { ActivityType } from "../../types/activity-log.types"

function ActivityTypeRow({
  type,
  canManage,
  onEdit,
  onToggleActive,
  onDelete,
}: {
  type: ActivityType
  canManage: boolean
  onEdit: (type: ActivityType) => void
  onToggleActive: (type: ActivityType) => void
  onDelete: (type: ActivityType) => void
}) {
  const Icon = getActivityIcon(type.icon)

  return (
    <div className="flex w-full items-center gap-3 rounded-xl bg-foreground/5 p-3">
      <div
        className="flex size-9 shrink-0 items-center justify-center rounded-full"
        style={{ backgroundColor: `${type.color}22`, color: type.color }}
      >
        <Icon size={16} />
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-foreground">
          {type.label}
        </p>

        <p className="text-xs text-muted-foreground">
          {type.active ? "Activa" : "Desactivada"}
          {" · "}
          {type.pinned ? "Predeterminada" : "Dentro de \u201cOtros\u201d"}
        </p>
      </div>

      <div className="flex items-center gap-1">
        <IconAction
          icon={Power}
          disabled={!canManage}
          onClick={() => onToggleActive(type)}
        />

        <IconAction
          icon={Pencil}
          disabled={!canManage}
          onClick={() => onEdit(type)}
        />

        <IconAction
          icon={Trash2}
          variant="danger"
          disabled={!canManage}
          onClick={() => onDelete(type)}
        />
      </div>
    </div>
  )
}

/** Mismo shell que ActivityTypeRow — sin árbol skeleton aparte. */
function ActivityTypeRowPlaceholder({ opacity }: { opacity: number }) {
  return (
    <div
      className="flex w-full animate-pulse items-center gap-3 rounded-xl bg-foreground/5 p-3"
      style={{ opacity }}
    >
      <div className="size-9 shrink-0 rounded-full bg-foreground/10" />
      <div className="min-w-0 flex-1 space-y-1.5">
        <div className="h-4 w-36 max-w-[50%] rounded bg-foreground/12" />
        <div className="h-3 w-28 max-w-[40%] rounded bg-foreground/5" />
      </div>
      <div className="flex gap-1">
        <div className="size-8 rounded-lg bg-foreground/5" />
        <div className="size-8 rounded-lg bg-foreground/5" />
        <div className="size-8 rounded-lg bg-foreground/5" />
      </div>
    </div>
  )
}

export function ActivityTypesPageContent() {
  const queryClient = useQueryClient()

  const [search, setSearch] = useState("")

  // true: trae también los desactivados, para poder reactivarlos.
  const { types, loading } = useActivityTypes(true)
  const { updateType, removeType } = useActivityTypeMutations()

  const { has } = usePermissions()
  const canManage = has(PermissionCode.ACTIVITY_TYPE_MANAGE)

  const [formOpen, setFormOpen] = useState(false)
  const [editingType, setEditingType] = useState<ActivityType | null>(null)
  const [pendingDelete, setPendingDelete] = useState<ActivityType | null>(null)

  // "Predeterminada" = seedeada por el sistema (tiene code).
  const { defaultTypes, customTypes } = useMemo(() => {
    const query = search.trim().toLowerCase()

    const filtered = query
      ? types.filter(type => type.label.toLowerCase().includes(query))
      : types

    return {
      defaultTypes: filtered.filter(type => Boolean(type.code)),
      customTypes: filtered.filter(type => !type.code),
    }
  }, [types, search])

  const handleEdit = (type: ActivityType) => {
    if (!canManage) return
    setEditingType(type)
    setFormOpen(true)
  }

  const handleToggleActive = (type: ActivityType) => {
    if (!canManage) return
    updateType({ id: type.id, dto: { active: !type.active } })
  }

  const handleDeleteRequest = (type: ActivityType) => {
    if (!canManage) return
    setPendingDelete(type)
  }

  const handleConfirmDelete = async () => {
    if (!pendingDelete || !canManage) {
      return
    }

    await removeType(pendingDelete.id)
    setPendingDelete(null)
  }

  const hasResults = defaultTypes.length > 0 || customTypes.length > 0

  return (
    <div className="relative flex h-full min-h-0 w-full flex-col">
      <AppListScroll
        onRefresh={async () => {
          await queryClient.invalidateQueries({ queryKey: ["activity-types"] })
        }}
      >
        <div className="mb-1 shrink-0">
          <EntityToolbar
            left={
              <div className="flex flex-wrap items-center gap-2 py-1">
                <EntityToolbarSearch value={search} onChange={setSearch} />
              </div>
            }
          />
        </div>

        <div className="flex flex-col gap-6">
          {loading ? (
            <>
              {/* Inline: mismas secciones/filas; el search real ya está arriba. */}
              {(["Predeterminadas", "Personalizadas"] as const).map(title => (
                <section key={title} className="flex flex-col gap-2">
                  <h2 className="px-1 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    {title}
                  </h2>
                  <div className="flex flex-col gap-1.5">
                    {Array.from({
                      length: title === "Predeterminadas" ? 3 : 2,
                    }).map((_, i) => (
                      <ActivityTypeRowPlaceholder
                        key={i}
                        opacity={1 - i * 0.15}
                      />
                    ))}
                  </div>
                </section>
              ))}
            </>
          ) : (
            <>
              <section className="flex flex-col gap-2">
                <h2 className="px-1 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  Predeterminadas
                </h2>

                {defaultTypes.map(type => (
                  <ActivityTypeRow
                    key={type.id}
                    type={type}
                    canManage={canManage}
                    onEdit={handleEdit}
                    onToggleActive={handleToggleActive}
                    onDelete={handleDeleteRequest}
                  />
                ))}

                {defaultTypes.length === 0 && (
                  <div className="flex h-20 items-center justify-center rounded-xl bg-foreground/5 text-sm text-muted-foreground">
                    {search
                      ? "Ninguna coincide con la búsqueda"
                      : "Sin actividades predeterminadas"}
                  </div>
                )}
              </section>

              <section className="flex flex-col gap-2">
                <h2 className="px-1 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  Personalizadas
                </h2>

                {customTypes.map(type => (
                  <ActivityTypeRow
                    key={type.id}
                    type={type}
                    canManage={canManage}
                    onEdit={handleEdit}
                    onToggleActive={handleToggleActive}
                    onDelete={handleDeleteRequest}
                  />
                ))}

                {customTypes.length === 0 && (
                  <div className="flex h-20 items-center justify-center rounded-xl bg-foreground/5 text-sm text-muted-foreground">
                    {search
                      ? "Ninguna coincide con la búsqueda"
                      : "Sin actividades personalizadas todavía"}
                  </div>
                )}
              </section>

              {!hasResults && (
                <div className="flex h-32 items-center justify-center rounded-xl bg-foreground/5 text-sm text-muted-foreground">
                  Sin tipos de actividad todavía
                </div>
              )}
            </>
          )}
        </div>
      </AppListScroll>

      <ActivityTypeFormDialog
        open={canManage && formOpen}
        onOpenChange={setFormOpen}
        editingType={editingType}
      />

      <ActionDialog
        open={canManage && !!pendingDelete}
        title="Eliminar actividad"
        description={
          pendingDelete
            ? `¿Eliminar "${pendingDelete.label}"? Las entradas de bitácora ya registradas con este tipo se van a seguir viendo, pero nadie va a poder elegirlo en entradas nuevas.`
            : ""
        }
        icon={Trash2}
        confirmLabel="Eliminar"
        variant="danger"
        onClose={() => setPendingDelete(null)}
        onConfirm={handleConfirmDelete}
      />
    </div>
  )
}