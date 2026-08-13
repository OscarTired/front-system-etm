"use client"

import {
  useEffect,
  useState,
} from "react"

import {
  ListChecks,
  Pin,
  MoreHorizontal,
} from "lucide-react"

import {
  FormDialog,
} from "@/shared/ui/dialogs/form-dialog/form-dialog"

import {
  cn,
} from "@/shared/utils/utils"

import {
  EntityColorPicker,
} from "@/shared/ui/entity-dialog/components/entity-color-picker"
import {
  EntityIconPicker,
} from "@/shared/ui/entity-dialog/components/entity-icon-picker"
import {
  EntityNameInput,
} from "@/shared/ui/entity-dialog/components/entity-name-input"
import {
  EntityPreview,
} from "@/shared/ui/entity-dialog/components/entity-preview"

import {
  useActivityTypeMutations,
} from "../../hooks/use-activity-type-mutations"

import type {
  ActivityType,
} from "../../types/activity-log.types"

import type {
  EntityForm,
} from "@/shared/ui/entity-dialog/entity-dialog.types"

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  // Si viene un tipo, es edición — si no, es alta nueva.
  editingType?: ActivityType | null
}

const DEFAULT_VALUE: EntityForm = {
  name: "",
  color: "#3B82F6",
  icon: undefined,
}

// Usa el mismo FormDialog que el resto de entidades del sistema
// (Usuarios, Clientes, etc.) para mantener una experiencia visual
// consistente y reutilizar el footer con Guardar/Cancelar.
export function ActivityTypeFormDialog({
  open,
  onOpenChange,
  editingType,
}: Props) {

  const {
    createType,
    updateType,
    creating,
    updating,
  } = useActivityTypeMutations()

  const [
    value,
    setValue,
  ] = useState<EntityForm>(DEFAULT_VALUE)

  // Separado de EntityForm a propósito: ese tipo es compartido con
  // Usuarios, Clientes, etc. — pinned es específico de Actividad, no
  // corresponde meterlo ahí. Se decide acá mismo, al crear o editar,
  // si el tipo va fijo en el picker o agrupado dentro de "Otros".
  const [
    pinned,
    setPinned,
  ] = useState(true)

  const isEditing =
    !!editingType

  const busy =
    creating ||
    updating

  useEffect(() => {

    if (open) {

      setValue(
        editingType
          ? {
              name: editingType.label,
              color: editingType.color,
              icon: editingType.icon as EntityForm["icon"],
            }
          : DEFAULT_VALUE,
      )

      setPinned(editingType?.pinned ?? true)

    }

  }, [
    open,
    editingType,
  ])

  async function handleSubmit() {

    if (
      !value.name.trim() ||
      !value.icon
    ) {
      return
    }

    try {

      if (isEditing) {

        await updateType({
          id: editingType.id,
          dto: {
            label: value.name.trim(),
            icon: value.icon,
            color: value.color,
            pinned,
          },
        })

      } else {

        await createType({
          label: value.name.trim(),
          icon: value.icon,
          color: value.color,
          pinned,
        })

      }

      onOpenChange(false)

    } catch (error) {

      // Mismo criterio que ProfileDialog: el toast lo muestra el
      // interceptor global, acá solo evitamos que la excepción
      // quede sin capturar y no cerramos el dialog en error.
      console.error("ACTIVITY TYPE SAVE ERROR", error)

    }

  }

  return (

    <FormDialog
      open={open}
      title={
        isEditing
          ? "Editar actividad"
          : "Nueva actividad"
      }
      icon={ListChecks}
      canSave={
        !!value.name.trim() &&
        !!value.icon
      }
      saving={busy}
      saveLabel={
        isEditing
          ? "Guardar"
          : "Crear actividad"
      }
      savingLabel={
        isEditing
          ? "Guardando..."
          : "Creando actividad..."
      }
      onClose={() => onOpenChange(false)}
      onSave={handleSubmit}
    >

      <div className="flex flex-col gap-4">

        <EntityPreview value={value} />

        <EntityNameInput
          value={value}
          onChange={setValue}
        />

        <EntityColorPicker
          value={value}
          onChange={setValue}
        />

        <EntityIconPicker
          value={value}
          onChange={setValue}
        />

        <div className="flex flex-col gap-2">

          <span className="text-xs font-medium text-muted-foreground">
            ¿Dónde aparece al registrar?
          </span>

          <div className="grid grid-cols-2 gap-2">

            <button
              type="button"
              onClick={() => setPinned(true)}
              className={cn(
                "flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                pinned
                  ? "bg-foreground/12 text-foreground"
                  : "bg-foreground/5 text-muted-foreground hover:bg-foreground/10 hover:text-foreground",
              )}
            >
              <Pin size={15} />
              Predeterminada
            </button>

            <button
              type="button"
              onClick={() => setPinned(false)}
              className={cn(
                "flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                !pinned
                  ? "bg-foreground/12 text-foreground"
                  : "bg-foreground/5 text-muted-foreground hover:bg-foreground/10 hover:text-foreground",
              )}
            >
              <MoreHorizontal size={15} />
              Dentro de &ldquo;Otros&rdquo;
            </button>

          </div>

          <p className="text-xs text-muted-foreground">
            {pinned
              ? "Va a salir como botón directo en la pantalla del picker."
              : "Va a salir agrupada dentro del botón \u201cOtros\u201d del picker."}
          </p>

        </div>

      </div>

    </FormDialog>

  )

}