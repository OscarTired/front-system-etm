"use client"

import {
  Plus,
} from "lucide-react"

import {
  PermissionCode,
} from "@/shared/core/enums/permission-code.enum"

import {
  usePermissions,
} from "@/features/permissions/hooks/use-permissions"

import {
  useResponsive,
} from "@/shared/responsive/hooks/use-responsive"

type Props={

  onClick:()=>void

}

export function ProjectTaskPlaceholder({

  onClick,

}:Props){

  const{
    has,
  }=
    usePermissions()

  const { isMobile } = useResponsive()

  const canCreate=
    has(
      PermissionCode.TASK_CREATE,
    )

  // Mismo lenguaje visual que el resumen colapsado de KpiCarousel:
  // una sola fila compacta, sin la caja alta/decorativa que sí
  // tiene sentido en desktop dentro del scroll horizontal de w-72.
  if (isMobile) {

    return (

      <button
        type="button"
        disabled={!canCreate}
        onClick={()=>{

          if(!canCreate){
            return
          }

          onClick()

        }}
        title={
          canCreate
            ?"Nueva tarea"
            :"No tienes permisos"
        }
        className={
          `flex h-12 w-full items-center gap-2.5 rounded-xl bg-linear-to-br from-white/4 via-white/2 to-transparent px-3 text-left transition
          ${
            canCreate
              ?"hover:bg-foreground/5"
              :"cursor-not-allowed opacity-50"
          }`
        }
      >

        <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-cyan-500/10">
          <Plus size={14} className="text-cyan-400" />
        </div>

        <span className="text-sm font-bold text-foreground">
          Nueva tarea
        </span>

        <span className="ml-auto shrink-0 text-xs text-muted-foreground">
          Agregar
        </span>

      </button>

    )

  }

  return(

    <button

      type="button"

      disabled={!canCreate}

      onClick={()=>{

        if(!canCreate){
          return
        }

        onClick()

      }}

      title={

        canCreate

          ?"Nueva tarea"

          :"No tienes permisos"

      }

      className={

        `group flex h-43.5 w-full flex-col items-center justify-center rounded-2xl
        bg-linear-to-br from-white/4 via-white/2 to-transparent
        transition-all duration-200

        ${

          canCreate

            ?"hover:border-cyan-500/20 hover:bg-foreground/5"

            :"cursor-not-allowed opacity-50"

        }`

      }

    >

      <div
        className={

          `mb-4 flex h-10 w-10 items-center justify-center rounded-full transition duration-200

          ${

            canCreate

              ?"bg-cyan-500/10 group-hover:scale-105 group-hover:bg-cyan-500/15"

              :"bg-cyan-500/5"

          }`

        }
      >

        <Plus
          size={20}
          className="text-cyan-400"
        />

      </div>

      <p className="text-xs font-bold uppercase tracking-[0.18em] text-foreground">

        Nueva tarea

      </p>

      <p className="mt-3 text-xs text-muted-foreground">

        Agregar al proyecto

      </p>

    </button>

  )

}