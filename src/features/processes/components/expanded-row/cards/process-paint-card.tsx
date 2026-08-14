"use client"

import { PaintBucket } from "lucide-react"

import { ProcessMiniCard } from "@/shared/ui/mini-card/process-mini-card"
import { ProcessEditableValue } from "./process-editable-value"

import { useWorkflowStepField } from "@/features/workflow/hooks/use-workflow-step-field"

import type { ProcessTask } from "../../../types/process.types"

type Props = {
  processTask: ProcessTask
  readOnly?: boolean
  size?: "default" | "large"
}

const toNumber = (value: unknown): number | null => {
  if (value == null) return null
  const text = String(value).trim()
  if (text === "") return null
  const number = Number(text)
  return Number.isFinite(number) ? number : null
}

/**
 * Card de pintura / acabado.
 * El hex del color de pieza pinta el glass (getGlassSurface vía ProcessMiniCard)
 * y se muestra un swatch del color real — mismo contrato theme que Producción.
 */
export function ProcessPaintCard({
  processTask,
  readOnly = false,
  size,
}: Props) {
  const updateField = useWorkflowStepField()

  const color = processTask.task.color
  const paintHex = color?.color?.trim() || null

  const hasPaintProcess = processTask.task.route.includes("PT")

  const relevantStep = readOnly
    ? processTask.paintStep
    : processTask.workflowStep

  const relevantStatus = relevantStep?.status

  const locked =
    readOnly ||
    relevantStatus === "COMPLETED" ||
    relevantStatus === "REVIEWED"

  const paintKgReal = relevantStep?.paintKgReal ?? null
  const stepId = relevantStep?.id ?? null

  // Dominio: color de pintura real; sin color → neutro de proceso (naranja PT).
  const domainHex = hasPaintProcess
    ? (paintHex ?? "#F97316")
    : "#94A3B8"

  const colorValue =
    paintHex != null ? (
      <span className="inline-flex min-w-0 max-w-full items-center gap-1.5">
        <span
          aria-hidden
          className="size-3.5 shrink-0 rounded-full ring-1 ring-black/15 dark:ring-white/20"
          style={{ backgroundColor: paintHex }}
        />
        <span className="min-w-0 truncate">{color?.name ?? paintHex}</span>
      </span>
    ) : (
      (color?.name ?? "-")
    )

  return (
    <ProcessMiniCard
      size={size}
      label={hasPaintProcess ? "Pintura" : "Acabado"}
      icon={PaintBucket}
      color={domainHex}
      rows={
        hasPaintProcess
          ? [
              {
                label: "Color",
                value: colorValue,
                editable: false,
              },
              {
                label: "Pedido",
                value: `${processTask.task.paintKg} KG`,
                editable: false,
              },
              {
                label: "Real",
                value: (
                  <ProcessEditableValue
                    numeric
                    value={paintKgReal}
                    suffix="KG"
                    disabled={locked}
                    onSave={async value => {
                      if (!stepId) return
                      const nextValue = toNumber(value)
                      await updateField(
                        stepId,
                        { paintKgReal: nextValue },
                        { paintKgReal: nextValue },
                      )
                    }}
                  />
                ),
                editable: !locked,
              },
            ]
          : [
              {
                label: "Tipo",
                value: "Natural",
                editable: false,
              },
            ]
      }
    />
  )
}
