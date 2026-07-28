"use client"

import { Search, ChevronDown } from "lucide-react"
import { useRef } from "react"

import { useResponsive } from "@/shared/responsive/hooks/use-responsive"
import { ENTITY_ICONS } from "@/shared/constants/entity-icons"
import { cn } from "@/shared/utils/utils"

import { Input } from "@/components/ui/input"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandList,
} from "@/components/ui/command"

import { DynamicBadge } from "@/shared/ui/badge/dynamic-badge"
import { EntityDialog } from "@/shared/ui/entity-dialog/entity-dialog"
import { SelectOption } from "@/shared/ui/select-option/select-option"
import { EntitySelectActions } from "./entity-select-actions"
import { useEntitySelect } from "./hooks/use-entity-select"
import { ActionDialog } from "@/shared/ui/dialogs/action-dialog/action-dialog"

import type { EntityBase } from "@/shared/types/entity-base.types"
import type { EntityForm } from "@/shared/ui/entity-dialog/entity-dialog.types"

import {
  collectionRegistry,
  type CollectionKey,
} from "@/features/master-data/registry/collection-registry"

type Props<T extends EntityBase> = {
  collection: CollectionKey
  value?: T
  items: T[]
  placeholder: string

  onChange: (value?: T) => void

  onCreate: (dto: EntityForm) => Promise<T>
  onEdit: (params: { id: string; dto: EntityForm }) => Promise<T>
  onDelete: (id: string) => Promise<void>

  disabled?: boolean

  variant?: "default" | "color"

  // "badge" (default): el trigger actual, badge coloreado a todo
  // el ancho — pensado para celdas de tabla. "row": fila compacta
  // (label chico + valor con ícono, fondo neutro) — pensada para
  // listas apiladas (ej. tarjeta de Proyectos, que ahora se usa
  // tanto en mobile como en desktop). En mobile el orden es label
  // primero (izquierda) y valor después (derecha); en desktop se
  // invierte (valor primero/izquierda, label después/derecha) y el
  // popover abre alineado a "start" en vez de centrado, para que no
  // quede descentrado en filas anchas.
  triggerVariant?: "badge" | "row"
  rowLabel?: string
}

export function EntitySelect<T extends EntityBase>({
  collection,
  value,
  items,
  placeholder,
  onChange,
  onCreate,
  onEdit,
  onDelete,
  disabled = false,
  variant = "default",
  triggerVariant = "badge",
  rowLabel,
}: Props<T>) {

  const {
    open,
    setOpen,

    dialogOpen,
    deleteOpen,
    deleting,

    editing,

    query,
    setQuery,

    filteredItems,

    handleSelect,
    handleClear,
    handleCreate,
    handleEdit,

    requestDelete,
    closeDelete,
    closeDialog,
  } = useEntitySelect({
    value,
    items,
    onChange,
  })

  const inputRef = useRef<HTMLInputElement>(null)

  const { isCompact } = useResponsive()

  const definition = collectionRegistry[collection]

  const RowIcon = value?.icon
    ? ENTITY_ICONS[value.icon]
    : undefined

  const dialogTitle = editing
    ? `Editar ${placeholder}`
    : `Crear ${placeholder}`

  async function handleSubmit(dto: EntityForm) {
    if (editing) {
      const result = await onEdit({
        id: editing.id,
        dto,
      })

      onChange(result)
    } else {
      await onCreate(dto)
    }

    closeDialog() 
  }

  return (
    <>
      <Popover
        open={disabled ? false : open}
        onOpenChange={(v) => {

          if (disabled) {
            return
          }

          setOpen(v)

          if (!v) {
            setQuery("")
          } else if (!isCompact) {

            // Autofoco solo en desktop/laptop — en mobile y tablet
            // abriría el teclado automáticamente apenas se muestra
            // el popover, sin que el usuario haya tocado el campo.
            requestAnimationFrame(
              () => inputRef.current?.focus(),
            )
          }

        }}
      >
        <PopoverTrigger asChild>

          {triggerVariant === "row" ? (() => {

            const labelEl = (
              <span className="shrink-0 text-xs font-medium text-neutral-500">
                {rowLabel}
              </span>
            )

            return (

              <button
                type="button"
                disabled={disabled}
                className="flex w-full min-w-0 items-center justify-between gap-2 rounded-lg bg-white/3 px-3 py-2.5 text-left transition hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-50"
              >

                {/* Un solo layout siempre, mobile y desktop — el
                    orden de desktop (el que ya funcionaba bien) es
                    el que se sigue en los dos. */}
                <span className="flex min-w-0 items-center gap-1.5">

                  {!disabled && (
                    <ChevronDown
                      size={14}
                      className={cn(
                        "shrink-0 text-neutral-500 transition-transform duration-200",
                        open && "rotate-180",
                      )}
                    />
                  )}

                  {RowIcon && (
                    <RowIcon
                      size={14}
                      className="shrink-0"
                      style={{ color: value?.color ?? "#737373" }}
                    />
                  )}

                  <span
                    className="truncate text-sm font-semibold"
                    style={{ color: value?.color ?? "#737373" }}
                  >
                    {value?.name ?? placeholder}
                  </span>

                </span>

                {labelEl}

              </button>

            )

          })() : (

            <button
              type="button"
              disabled={disabled}
              className="flex w-full min-w-0 items-center disabled:cursor-not-allowed"
            >

              <DynamicBadge
                label={value?.name ?? placeholder}
                color={value?.color ?? "#64748B"}
                icon={value?.icon}
                variant={collection === "colors" ? "solid" : "subtle"}
                placeholder={!value}
                width="field"
                showChevron={!disabled}
                chevronOpen={open}
              />

            </button>

          )}

        </PopoverTrigger>

        <PopoverContent
          className="w-72 p-2"
          align={triggerVariant === "row" ? "start" : "center"}
        >
          <Command>
            <div className="sticky top-0 z-20 mb-2 flex items-center gap-2 px-2 pb-2">
              <Search size={14} className="text-white/35" />

              <Input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar..."
                className="h-9 border-0 bg-transparent px-0"
              />
            </div>

            <CommandList className="max-h-64 overflow-y-auto">
              <CommandEmpty>Sin resultados</CommandEmpty>

              <CommandGroup>
                {filteredItems.map((item) => (
                  <SelectOption
                    key={item.id}
                    label={item.name}
                    icon={item.icon}
                    color={item.color}
                    variant={variant}
                    selected={value?.id === item.id}
                    onSelect={() => handleSelect(item)}
                    onEdit={
                      definition.canEdit
                        ? () => handleEdit(item)
                        : undefined
                    }
                    onDelete={
                      definition.canDelete
                        ? () => requestDelete(item)
                        : undefined
                    }
                  />
                ))}
              </CommandGroup>
            </CommandList>

            <EntitySelectActions
              onClear={handleClear}
              onCreate={handleCreate}
              canCreate={definition.canCreate}
            />
          </Command>
        </PopoverContent>

      </Popover>

      {/* CREATE / EDIT */}
      {dialogOpen && (
        <EntityDialog
          open={dialogOpen}
          title={dialogTitle}
          initialValue={
            editing
              ? {
                  name: editing.name,
                  icon: editing.icon,
                  color: editing.color,
                }
              : undefined
          }
          showIconPicker={definition.fields.includes("icon")}
          previewVariant={collection === "colors" ? "solid" : "subtle"}
          fixedIcon={definition.fixedIcon}
          allowedIcons={definition.allowedIcons}
          onClose={closeDialog}
          onSubmit={handleSubmit}
        />
      )}

      {/* DELETE CONFIRM */}
      {deleteOpen && deleting && (
        <ActionDialog
          open={deleteOpen}
          title="Eliminar elemento"
          description={`¿Seguro que deseas eliminar "${deleting.name}"? Esta acción no se puede deshacer.`}
          cancelLabel="Cancelar"
          confirmLabel="Eliminar"
          onClose={closeDelete}
          onConfirm={async () => {
            await onDelete(deleting.id)
            onChange(undefined)
            closeDelete()
          }}
        />
      )}
    </>
  )
}