"use client"

import {
  forwardRef,
} from "react"

import {
  Funnel,
} from "lucide-react"

import {
  cn,
} from "@/shared/utils/utils"

import {
  useResponsive,
} from "@/shared/responsive/hooks/use-responsive"

import {
  FabTrigger,
} from "@/shared/ui/speed-dial-fab/fab-trigger"

type Props={
  expanded?:boolean
  active?:boolean
} & React.ButtonHTMLAttributes<HTMLButtonElement>

export const FilterAddButton=
  forwardRef<
    HTMLButtonElement,
    Props
  >(
    (
      {
        expanded=false,
        active=false,
        className,
        ...props
      },
      ref
    )=>{

      const { isMobile } = useResponsive()

      // Mobile (fila del FAB): mismo look pastilla+círculo que el
      // resto de las acciones — sin la animación de expandir/
      // colapsar, que solo tiene sentido en el header de escritorio.
      if (isMobile) {
        return (
          <FabTrigger
            ref={ref}
            icon={Funnel}
            label="FILTROS"
            active={active}
            className={className}
            {...props}
          />
        )
      }

      return (

      <button
        ref={ref}
        type="button"
        className={cn(
          "flex",
          className
        )}
        {...props}
      >

        <div
          className={cn(
            "flex items-center overflow-hidden transition-all duration-200 ease-out",
            expanded
              ? "w-24"
              : "w-8"
          )}
        >

          <span
            className={cn(
              "flex h-8 w-8 shrink-0 items-center justify-center rounded-xl select-none text-white transition-all duration-200",
              active
                ? "bg-[#101012]"
                : !expanded &&
                  "hover:bg-[#101012]"
            )}
          >

            <Funnel
              size={14}
              strokeWidth={2}
            />

          </span>

          <span
            className={cn(
              "overflow-hidden whitespace-nowrap text-xs font-semibold select-none uppercase tracking-[0.08em] text-white transition-all duration-200",
              expanded
                ? "w-full opacity-100"
                : "w-0 opacity-0"
            )}
          >

            + FILTROS

          </span>

        </div>

      </button>

      )
    }
  )

FilterAddButton.displayName=
  "FilterAddButton"