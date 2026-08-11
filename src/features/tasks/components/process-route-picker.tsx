"use client"

import {
  Fragment,
  memo,
} from "react"

import type {
  ProcessCode,
} from "../types/task.types"

import {
  PROCESS_ORDER,
} from "../constants/process.constants"

import {
  PROCESS_DEFINITIONS,
} from "@/features/processes/constants/process-definitions"

import {
  DynamicBadge,
} from "@/shared/ui/badge/dynamic-badge"

import {
  ENTITY_ICONS,
} from "@/shared/constants/entity-icons"

type Props = {
  value: ProcessCode[]
  onChange: (value: ProcessCode[]) => void
  /** Procesos que no se pueden quitar (ruta ya iniciada). Sí se pueden agregar nuevos. */
  lockedCodes?: ProcessCode[]
  disabled?: boolean
}

const PROCESS_ENTRIES =
  Object.entries(PROCESS_ORDER).sort(
    ([, a], [, b]) => a.order - b.order
  )

type ProcessChipProps = {
  processCode: ProcessCode
  active: boolean
  locked: boolean
  disabled: boolean
  onToggle: (code: ProcessCode) => void
}

const ProcessChip =
  memo(function ProcessChip({
    processCode,
    active,
    locked,
    disabled,
    onToggle,
  }: ProcessChipProps) {

    const process =
      PROCESS_DEFINITIONS[processCode]

    const Icon =
      ENTITY_ICONS[process.icon]

    const cannotToggle = disabled || (locked && active)

    return (

      <div
        role="button"
        tabIndex={cannotToggle ? -1 : 0}
        title={
          locked && active
            ? "No se puede quitar: la producción ya inició"
            : undefined
        }
        onClick={() => {
          if (!cannotToggle) onToggle(processCode)
        }}
        onKeyDown={event => {

          if (cannotToggle) return

          if (
            event.key === "Enter" ||
            event.key === " "
          ) {
            event.preventDefault()
            onToggle(processCode)
          }

        }}
        className={
          cannotToggle
            ? "cursor-not-allowed opacity-50"
            : "cursor-pointer"
        }
      >

        <DynamicBadge
          label={processCode}
          color={process.color}
          iconComponent={Icon}
          muted={!active}
          active={false}
          width="process"
        />

      </div>

    )

  })

export function ProcessRoutePicker({
  value,
  onChange,
  lockedCodes = [],
  disabled = false,
}: Props) {

  const lockedSet = new Set(lockedCodes)

  const toggle = (code: ProcessCode) => {

    if (disabled) return

    const exists = value.includes(code)

    if (exists && lockedSet.has(code)) return

    const next =
      exists
        ? value.filter(item => item !== code)
        : [...value, code]

    onChange(
      PROCESS_ENTRIES
        .map(([code]) => code as ProcessCode)
        .filter(code => next.includes(code))
    )

  }

  return (

    <div className="space-y-4">

      <div className="flex flex-wrap justify-center gap-3">

        {PROCESS_ENTRIES.map(([code]) => {

          const processCode = code as ProcessCode

          return (

            <ProcessChip
              key={processCode}
              processCode={processCode}
              active={value.includes(processCode)}
              locked={lockedSet.has(processCode)}
              disabled={disabled}
              onToggle={toggle}
            />

          )

        })}

      </div>

      <div className="flex min-h-5 items-center justify-center">

        {value.length > 0 && (

          <div className="flex flex-wrap items-center gap-1.5 text-sm">

            {value.map((process, index) => {

              const definition =
                PROCESS_DEFINITIONS[process]

              const isLast =
                index === value.length - 1

              return (

                <Fragment key={`${process}-${index}`}>

                  <span
                    className={
                      isLast
                        ? "font-bold"
                        : "font-medium text-neutral-500"
                    }
                    style={
                      isLast
                        ? {
                            color: definition.color,
                            textShadow: `0 0 10px ${definition.color}55`,
                          }
                        : undefined
                    }
                  >
                    {process}
                  </span>

                  {!isLast && (
                    <span className="text-neutral-700">→</span>
                  )}

                </Fragment>

              )

            })}

          </div>

        )}

      </div>

    </div>

  )

}