"use client"

import {
  Check,
  Pause,
  Play,
  Search,
} from "lucide-react"

import {
  Spinner,
} from "@/shared/ui/spinner/spinner"

import {
  cn,
} from "@/shared/utils/utils"

type Props={

  label:string

  variant?:
    |"start"
    |"pause"
    |"complete"
    |"review"

  onClick:()=>void

  iconOnly?:boolean

  disabled?:boolean

  loading?:boolean

  // Label mostrado mientras loading es true. Si no se pasa, usa el
  // genérico "Procesando..." (comportamiento anterior).
  loadingLabel?:string

  fullWidth?:boolean

  // Sin min-width fijo (120px) y padding más chico — para columnas
  // de tabla angostas, donde el botón no tenía espacio real y
  // terminaba "saliéndose" de su columna. Los otros usos (overlay
  // del pipeline, botones del workflow expandido) siguen con el
  // tamaño cómodo de siempre.
  compact?:boolean

}

export function WorkflowAction({

  label,

  variant="start",

  onClick,

  iconOnly=false,

  disabled=false,

  loading=false,

  loadingLabel,

  fullWidth=false,

  compact=false,

}:Props){

  const config=

    variant==="start"

      ?{

          icon:Play,

          iconClass:"text-muted-foreground",

        }

      :variant==="pause"

        ?{

            icon:Pause,

            iconClass:"text-amber-300",

          }

        :variant==="complete"

          ?{

              icon:Check,

              iconClass:"text-emerald-300",

            }

          :{

              icon:Search,

              iconClass:"text-sky-300",

            }

  const Icon=config.icon

  const isDisabled=
    disabled||loading

  return(

    <button

      type="button"

      disabled={isDisabled}

      onMouseDown={event=>

        event.preventDefault()

      }

      onClick={()=>{

        if(isDisabled){
          return
        }

        onClick()

      }}

      title={

        loading

          ?(loadingLabel??label)

          :disabled

            ?"No tienes permisos"

            :label

      }

      className={cn(

        "flex h-9 items-center justify-center rounded-lg text-xs font-semibold transition-colors duration-150 select-none",

        iconOnly

          ?"w-10 px-0"

          :compact

            ? "w-28 gap-1.5 px-2"

            :fullWidth

              ?"w-full gap-2 px-3"

              :"min-w-30 gap-2 px-3",

        isDisabled

          ?"cursor-not-allowed bg-foreground/5 text-foreground/35 opacity-50"

          :"bg-foreground/5 text-foreground hover:bg-foreground/10 active:bg-white/12",

        loading&&"opacity-70",

      )}

    >

      {loading ? (

        <Spinner size={14} />

      ) : (

        <Icon

          size={14}

          strokeWidth={2.4}

          className={cn(

            config.iconClass,

            isDisabled&&"opacity-40",

            "shrink-0",

          )}

        />

      )}

      {!iconOnly&&!loading&&(

        <span className="min-w-0 truncate select-none">

          {label}

        </span>

      )}

    </button>

  )

}