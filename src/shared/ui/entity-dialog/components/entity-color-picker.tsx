import {
  entityColors,
} from "../config/entity-options"

import {
  cn,
} from "@/shared/utils/utils"

import type {
  EntityEditorProps,
} from "../entity-dialog.types"

export function EntityColorPicker({
  value,
  onChange,
}: EntityEditorProps){

  return(

    <div className="space-y-3">

      <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">

        Colores

      </p>

      <div className="flex items-center justify-center gap-3">

        {entityColors.map(color=>{

          const active=
            value.color===
            color

          return(

            <button
              key={color}
              type="button"
              onClick={()=>

                onChange({

                  ...value,

                  color,

                })

              }
              style={{
                backgroundColor:color,
              }}
              className={cn(
                "h-9 w-9 rounded-full transition hover:scale-110",
                active &&
                  "ring-2 ring-white",
              )}
            />

          )

        })}

      </div>

    </div>

  )

}