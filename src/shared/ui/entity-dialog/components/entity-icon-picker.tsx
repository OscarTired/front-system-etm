"use client"

import {
  entityIcons,
} from "../config/entity-options"

import {
  cn,
} from "@/shared/utils/utils"

import type {
  EntityEditorProps,
} from "../entity-dialog.types"
import { ScrollArea } from "@/components/ui/scroll-area"

type Props =
  EntityEditorProps & {

    allowedIcons?: string[]

  }

export function EntityIconPicker({
  value,
  onChange,
  allowedIcons,
}: Props) {

  const icons =

    allowedIcons

      ? entityIcons.filter(
          item =>
            allowedIcons.includes(
              item.id
            )
        )

      : entityIcons

  const sortedIcons =

    value.icon

      ? [

          ...icons.filter(
            item =>
              item.id === value.icon
          ),

          ...icons.filter(
            item =>
              item.id !== value.icon
          ),

        ]

      : icons

  return (

    <div className="space-y-3">

      <p className="text-center text-xs font-semibold text-neutral-400">

        Icono

      </p>

      <div className="relative">

        {/* 40vh en mobile: evita que la grilla de íconos tape toda
            la pantalla en un teléfono. De tablet en adelante ya hay
            espacio de sobra, así que pasa a un tope fijo normal. */}
        <ScrollArea className="max-h-[40vh] tablet:max-h-64">

          <div className="flex flex-wrap justify-center gap-2 px-4 py-4">

            {sortedIcons.map(item => {

              const Icon =
                item.icon

              const active =
                value.icon === item.id

              return (

                <button
                  key={item.id}
                  type="button"
                  onClick={() =>
                    onChange({
                      ...value,
                      icon: item.id,
                    })
                  }
                  style={
                    active
                      ? {
                          color:
                            value.color,

                          backgroundColor:
                            `${value.color}20`,

                          boxShadow: `
                            inset 0 0 0 1px ${value.color},
                            0 0 12px ${value.color}35
                          `,
                        }
                      : undefined
                  }
                  className={cn(
                    "flex h-11 w-11 items-center justify-center rounded-xl transition-all duration-200",
                    !active && [
                      "bg-white/5",
                      "text-neutral-500",
                      "hover:bg-white/8",
                      "hover:text-neutral-300",
                    ]
                  )}
                >

                  <Icon
                    size={20}
                    strokeWidth={2}
                  />

                </button>

              )

            })}

          </div>

        </ScrollArea>

      </div>

    </div>

  )

}