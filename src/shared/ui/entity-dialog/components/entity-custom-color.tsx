import {
  useMemo,
} from "react"

import {
  Input,
} from "@/components/ui/input"

import {
  HexColorPicker,
} from "@/shared/ui/color-picker/components/hex-color-picker"

import {
  useHexFormat,
} from "@/shared/ui/color-picker/hooks/use-hex-format"

import {
  isValidHex,
  normalizeHex,
} from "@/shared/ui/color-picker/utils/color"

import type {
  EntityEditorProps,
} from "../entity-dialog.types"

import {
  hexToRgb,
  rgbToHex,
} from "@/shared/utils/color-utils"

const channels=[
  ["r","R"],
  ["g","G"],
  ["b","B"],
] as const

export function EntityCustomColor({

  value,
  onChange,

}:EntityEditorProps){

  const rgb=
    useMemo(
      ()=>
        hexToRgb(
          value.color,
        ),
      [value.color],
    )

  // useHexFormat es lo mismo que usa el HexInput de ADENTRO del
  // popover del color picker — sanitiza mientras se tipea (deja
  // solo hex válidos parciales) y, al confirmar (blur/Enter), valida
  // el hex completo: si no es válido, REVIERTE al último valor bueno
  // en vez de guardar cualquier cosa a medio escribir. El "updateHex"
  // de acá antes solo hacía un chequeo de regex por tecla y ya, sin
  // revertir nunca si quedaba inválido.
  const {
    inputValue,
    handleInputChange,
    handleInputBlur,
    handleInputKeyDown,
  } = useHexFormat({

    hex: value.color,

    onCommit: candidate => {

      if (!isValidHex(candidate)) {
        return false
      }

      onChange({
        ...value,
        color: normalizeHex(candidate),
      })

      return true

    },

  })

  function updateRgb(

    key:"r"|"g"|"b",

    nextValue:string,

  ){

    const parsed=
      Number(
        nextValue,
      )

    if(
      Number.isNaN(
        parsed,
      )
    ){

      return

    }

    const next={

      ...rgb,

      [key]:
        parsed,

    }

    onChange({

      ...value,

      color:
        rgbToHex(

          next.r,

          next.g,

          next.b,

        ),

    })

  }

  return(

    <div className="space-y-3">

      <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">

        Color personalizado

      </p>

      <div className="flex overflow-hidden rounded-xl bg-foreground/5">

        <HexColorPicker
          value={value.color}
          onChange={hex=>

            onChange({

              ...value,

              color:
                hex ?? value.color,

            })

          }
          showLabel={false}
          className="h-9 w-20 shrink-0"
        />

        <div className="flex h-9 flex-1 items-center gap-0.5 px-6">

          <span className="font-mono text-base font-semibold text-muted-foreground">
            #
          </span>

          <Input
            value={
              inputValue.toUpperCase()
            }
            onChange={event=>

              handleInputChange(
                event.target.value,
              )

            }
            onBlur={handleInputBlur}
            onKeyDown={handleInputKeyDown}
            className="h-9 flex-1 rounded-none bg-transparent px-0 text-base font-semibold uppercase tracking-wide text-foreground"
          />

        </div>

      </div>

      <div className="grid h-9 w-full grid-cols-3 gap-4">

        {channels.map(([key,label])=>(

          <div
            key={key}
            className="space-y-1"
          >

            <Input
              value={
                rgb[key]
              }
              inputMode="numeric"
              onChange={event=>

                updateRgb(
                  key,
                  event.target.value,
                )

              }
              className="h-9 rounded-xl text-center text-sm font-semibold text-muted-foreground"
            />

            <p className="text-center text-xs font-semibold text-muted-foreground">

              {label}

            </p>

          </div>

        ))}

      </div>

    </div>

  )

}