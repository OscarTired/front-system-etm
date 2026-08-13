"use client"

import {
  Info,
} from "lucide-react"

import {
  Input,
} from "@/components/ui/input"

import {
  FormSection,
} from "@/shared/ui/dialogs/form-dialog/form-section"

import {
  FormField,
} from "@/shared/ui/dialogs/form-dialog/form-field"

import {
  EntitySelect,
} from "@/shared/ui/entity-select/entity-select"

import {
  DatePicker,
} from "@/shared/ui/date-picker/components/date-picker"

import {
  parseISODate,
  toISODateString,
} from "@/shared/ui/date-picker/utils/date-format"

import {
  ProcessRoutePicker,
} from "@/features/tasks/components/process-route-picker"

import {
  usePriorities,
} from "@/features/priorities/hooks/use-priorities"

import {
  useColors,
} from "@/features/colors/hooks/use-colors"

import type {
  TaskFormSectionProps,
} from "./types"

export function TaskInfoSection({

  form,

  update,

  routeLocked,
  lockedRouteCodes = [],

  errors,

}:TaskFormSectionProps){

  const{

    priorities,

    create:createPriority,

    update:updatePriority,

    remove:deletePriority,

  }=
    usePriorities()

  const{

    colors,

    create:createColor,

    update:updateColor,

    remove:deleteColor,

  }=
    useColors()

  const selectedPriority=
    priorities.find(
      item=>
        item.id===form.priorityId,
    )

  const selectedColor=
    colors.find(
      item=>
        item.id===form.colorId,
    )

  const hasAssembly=
    form.route.includes(
      "EN",
    )

  const hasPaint=
    form.route.includes(
      "PT",
    )

  return(

    <FormSection
      title="Información"
      icon={Info}
    >

      <div className="grid grid-cols-1 gap-4 tablet:grid-cols-2 tablet:gap-6">

        <FormField label="Nombre de tarea *" error={errors?.reference}>

          <Input
            value={form.reference}
            placeholder="PIEZAS DE AUTOSOPORTADO"
            onChange={event=>
              update({
                reference:
                  event.target.value.toUpperCase(),
              })
            }
          />

        </FormField>

        <FormField label="Lote *" error={errors?.lotNumber}>

          <Input
            value={
              form.lotNumber===0
                ? ""
                : String(form.lotNumber)
            }
            inputMode="numeric"
            placeholder="1"
            onChange={event=>{

              const value=
                event.target.value

              update({

                lotNumber:

                  value===""

                    ? 0

                    : Number(value),

              })

            }}
          />

        </FormField>

      </div>

      <div className="mt-3">

        <FormField label="Ruta de producción *" error={errors?.route}>

          <ProcessRoutePicker
            value={form.route}
            lockedCodes={lockedRouteCodes}
            onChange={route =>
              update({
                route,
              })
            }
          />

          {(lockedRouteCodes?.length ?? 0) > 0 && (

            <p className="mt-2 text-xs text-neutral-500">
              Puedes agregar procesos. No se pueden quitar los que ya estaban en la ruta una vez iniciada la producción.
            </p>

          )}

        </FormField>

      </div>

      <div className="mt-3 grid grid-cols-1 gap-4 tablet:grid-cols-3">

        <FormField label="Fecha de entrega *" error={errors?.deliveryDate}>

          <div className="flex justify-center">

            <DatePicker
              value={parseISODate(form.deliveryDate)}
              onChange={(date) =>
                update({ deliveryDate: toISODateString(date) })
              }
              placeholder="fecha"
              className="w-44"
            />

          </div>

        </FormField>

        <FormField label="Prioridad *" error={errors?.priorityId}>

          <EntitySelect
            collection="priorities"
            value={selectedPriority}
            items={priorities}
            placeholder="Prioridad"
            onChange={entity=>
              update({
                priorityId:
                  entity?.id??"",
              })
            }
            onCreate={createPriority}
            onEdit={updatePriority}
            onDelete={deletePriority}
          />

        </FormField>

        <FormField
          label="Color de pintura"
          error={errors?.colorId}
        >

          <div
            className={
              !hasPaint
                ? "pointer-events-none opacity-50"
                : ""
            }
          >

            <EntitySelect
              collection="colors"
              variant="color"
              value={selectedColor}
              items={colors}
              placeholder="Color"
              onChange={entity =>
                update({
                  colorId: entity?.id ?? null,
                })
              }
              onCreate={createColor}
              onEdit={updateColor}
              onDelete={deleteColor}
            />

          </div>

        </FormField>

      </div>

      <div className="mt-3 grid grid-cols-1 gap-4 tablet:grid-cols-2">

        <FormField
          label="Ensamblados"
          error={errors?.assemblyCount}
        >

          <Input
            disabled={!hasAssembly}
            value={
              form.assemblyCount === 0
                ? ""
                : String(form.assemblyCount)
            }
            inputMode="numeric"
            placeholder="1"
            onChange={event => {

              const value =
                event.target.value

              update({

                assemblyCount:

                  value === ""

                    ? 0

                    : Number(value),

              })

            }}
          />

        </FormField>

        <FormField
          label="Kg pintura"
          error={errors?.paintKg}
        >

          <Input
            type="number"
            step="0.01"
            disabled={!hasPaint}
            value={
              form.paintKg === 0
                ? ""
                : String(form.paintKg)
            }
            inputMode="decimal"
            placeholder="0"
            onChange={event => {

              const value =
                event.target.value

              update({

                paintKg:

                  value === ""

                    ? 0

                    : Number(value),

              })

            }}
          />

        </FormField>

      </div>

    </FormSection>

  )

}