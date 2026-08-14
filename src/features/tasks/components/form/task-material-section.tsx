"use client"

import { Package, Trash2 } from "lucide-react"

import { Input } from "@/components/ui/input"
import { FormSection } from "@/shared/ui/dialogs/form-dialog/form-section"
import { FormField } from "@/shared/ui/dialogs/form-dialog/form-field"
import { EntitySelect } from "@/shared/ui/entity-select/entity-select"
import { useMaterials } from "@/features/materials/hooks/use-materials"
import { useThicknesses } from "@/features/thicknesses/hooks/use-thicknesses"
import { useResponsive } from "@/shared/responsive/hooks/use-responsive"
import { cn } from "@/shared/utils/utils"

import type { TaskFormSectionProps } from "./types"
import type { TaskMaterialLineForm } from "../../hooks/use-task-form"

export function TaskMaterialSection({
  form,
  update,
  errors,
}: TaskFormSectionProps) {
  const { isMobile } = useResponsive()

  const {
    materials,
    create: createMaterial,
    update: updateMaterial,
    remove: deleteMaterial,
  } = useMaterials()

  const {
    thicknesses,
    create: createThickness,
    update: updateThickness,
    remove: deleteThickness,
  } = useThicknesses()

  const lines = form.materials?.length
    ? form.materials
    : [
        {
          materialId: form.materialId,
          thicknessId: form.thicknessId,
          pieces: form.pieces || 1,
        },
      ]

  const totalPieces = lines.reduce(
    (s, l) => s + (Number(l.pieces) || 0),
    0,
  )

  const setLines = (next: TaskMaterialLineForm[]) => {
    const primary = [...next]
      .filter(l => l.materialId)
      .sort((a, b) => Number(b.pieces) - Number(a.pieces))[0]
    update({
      materials: next,
      materialId: primary?.materialId ?? "",
      thicknessId: primary?.thicknessId ?? "",
      pieces: next.reduce((s, l) => s + (Number(l.pieces) || 0), 0),
    })
  }

  const updateLine = (
    index: number,
    patch: Partial<TaskMaterialLineForm>,
  ) => {
    setLines(
      lines.map((l, i) => (i === index ? { ...l, ...patch } : l)),
    )
  }

  const removeLine = (index: number) => {
    if (lines.length <= 1) return
    setLines(lines.filter((_, i) => i !== index))
  }

  const totalLabel = (
    <span className="text-[11px] tabular-nums text-muted-foreground">
      Total:{" "}
      <span className="font-semibold text-foreground">{totalPieces}</span>{" "}
      piezas
    </span>
  )

  return (
    <FormSection title="Material" icon={Package} trailing={totalLabel}>
      {/*
        Scroll nativo. stopPropagation evita que el ScrollArea del
        FormDialog capture la rueda / el gesto.
      */}
      <div
        className={cn(
          "flex max-h-[14rem] flex-col gap-2 overflow-y-auto overscroll-y-contain",
          "scrollbar-none [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden",
        )}
        onWheel={e => e.stopPropagation()}
        onTouchMove={e => e.stopPropagation()}
      >
        {lines.map((line, index) => {
          const selectedMaterial = materials.find(
            m => m.id === line.materialId,
          )
          const selectedThickness = thicknesses.find(
            th => th.id === line.thicknessId,
          )

          return (
            <div
              key={index}
              className={cn(
                "grid grid-cols-1 gap-3",
                isMobile
                  ? "rounded-xl bg-foreground/5 p-3"
                  : "rounded-lg bg-background/70 p-2.5",
                "tablet:grid-cols-[1fr_1fr_5.5rem_auto]",
              )}
            >
              <FormField
                label={index === 0 ? "Material *" : "Material"}
                error={index === 0 ? errors?.materialId : undefined}
              >
                <EntitySelect
                  collection="materials"
                  value={selectedMaterial}
                  items={materials}
                  placeholder="Material"
                  onChange={entity =>
                    updateLine(index, {
                      materialId: entity?.id ?? "",
                    })
                  }
                  onCreate={createMaterial}
                  onEdit={updateMaterial}
                  onDelete={deleteMaterial}
                />
              </FormField>

              <FormField
                label={index === 0 ? "Espesor *" : "Espesor"}
                error={index === 0 ? errors?.thicknessId : undefined}
              >
                <EntitySelect
                  collection="thicknesses"
                  value={selectedThickness}
                  items={thicknesses}
                  placeholder="Espesor"
                  onChange={entity =>
                    updateLine(index, {
                      thicknessId: entity?.id ?? "",
                    })
                  }
                  onCreate={createThickness}
                  onEdit={updateThickness}
                  onDelete={deleteThickness}
                />
              </FormField>

              <FormField
                label={index === 0 ? "Piezas *" : "Piezas"}
                error={index === 0 ? errors?.pieces : undefined}
              >
                <Input
                  value={line.pieces ? String(line.pieces) : ""}
                  inputMode="numeric"
                  placeholder="0"
                  onChange={event =>
                    updateLine(index, {
                      pieces: Number(event.target.value) || 0,
                    })
                  }
                />
              </FormField>

              <div className="flex items-end pb-0.5">
                <button
                  type="button"
                  disabled={lines.length <= 1}
                  onClick={() => removeLine(index)}
                  className={cn(
                    "flex size-9 items-center justify-center rounded-lg text-muted-foreground transition",
                    "hover:bg-foreground/5 hover:text-foreground",
                    "disabled:pointer-events-none disabled:opacity-30",
                  )}
                  aria-label="Quitar material"
                >
                  <Trash2 size={15} strokeWidth={2} />
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </FormSection>
  )
}
