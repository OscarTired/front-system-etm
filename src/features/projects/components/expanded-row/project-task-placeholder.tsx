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

import {
  useBadgeColors,
} from "@/shared/utils/use-badge-colors"

type Props={

  onClick:()=>void

}

// cyan-500 — mismo hex que usa el resto del sistema de badges para
// "crear/agregar". Un solo valor, una sola fuente para el color en sí.
const CYAN_HEX = "#06b6d4"

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

  // Mismo sistema que ProcessMiniCard/DynamicBadge (useBadgeColors):
  // el alpha del círculo cian ya está resuelto por tema en un solo
  // lugar reutilizable, en vez de pares dark:/light hardcoded a mano.
  // El wash de fondo usa `foreground` (neutral, no un color puntual)
  // que ya se invierte solo entre temas — eso queda igual.
  const badge = useBadgeColors(CYAN_HEX, "subtle")

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
          `flex h-12 w-full items-center gap-2.5 rounded-xl bg-linear-to-br from-foreground/8 via-foreground/3 to-transparent px-3 text-left transition
          ${
            canCreate
              ?"hover:bg-foreground/10"
              :"cursor-not-allowed opacity-50"
          }`
        }
      >

        <div
          className="flex size-7 shrink-0 items-center justify-center rounded-full"
          style={{ backgroundColor: badge.background }}
        >
          <Plus size={14} style={{ color: badge.text }} />
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
        bg-linear-to-br from-foreground/8 via-foreground/3 to-transparent
        transition-all duration-200

        ${

          canCreate

            ?"hover:bg-foreground/10"

            :"cursor-not-allowed opacity-50"

        }`

      }

    >

      <div
        className="mb-4 flex h-10 w-10 items-center justify-center rounded-full transition duration-200 group-hover:scale-105"
        style={{
          backgroundColor: badge.background,
          opacity: canCreate ? 1 : 0.6,
        }}
      >

        <Plus
          size={20}
          style={{ color: badge.text }}
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
