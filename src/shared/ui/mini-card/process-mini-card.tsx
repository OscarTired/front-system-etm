"use client"

import type {
  LucideIcon,
} from "lucide-react"

import type {
  ReactNode,
} from "react"

import {
  getBadgeColors,
} from "@/shared/utils/badge-colors"

import { useResponsive } from "@/shared/responsive/hooks/use-responsive"
import { cn } from "@/shared/utils/utils"

type Row={

  label:string

  value:ReactNode

  secondary?:string

  editable?:boolean

}

type Props={

  label:string

  icon:LucideIcon

  color:string

  rows:Row[]

  size?:"default"|"large"

}

export function ProcessMiniCard({

  label,
  icon:Icon,
  color,
  rows,
  size="default",

}:Props){

  const { isMobile } = useResponsive()

  const textColor=
    getBadgeColors(
      color,
      "subtle"
    ).text

  const isLarge=size==="large"

  return(

    <div
      className={cn(
        "flex h-full select-none flex-col overflow-hidden rounded-xl p-4",
        isLarge
          ? "justify-center gap-5 p-6"
          : isMobile ? "gap-3" : "min-h-43.5",
      )}
      style={{
        background:
          `linear-gradient(
            135deg,
            ${color}20,
            #101012
          )`,
      }}
    >

      <div className={cn("flex min-w-0 items-center justify-between gap-2", !isLarge && !isMobile && "mb-3")}>

        <span
          className={cn(
            "min-w-0 truncate font-bold uppercase tracking-[0.18em]",
            isLarge ? "text-sm" : "text-xs",
          )}
          style={{
            color:textColor,
          }}
        >

          {label}

        </span>

        <Icon
          size={isLarge ? 26 : 20}
          className="shrink-0"
          style={{
            color:textColor,
          }}
        />

      </div>

      {isLarge ? (

        <div className="flex min-w-0 flex-col gap-4">

          {rows.map(
            row=>(

              <div
                key={row.label}
                className="flex min-w-0 items-baseline justify-between gap-2"
              >

                <p className="min-w-0 shrink truncate text-xs font-bold uppercase tracking-[0.14em] text-neutral-500">

                  {row.label}

                </p>

                <div className="flex min-w-0 shrink-0 items-baseline gap-1.5">

                  <span
                    className={
                      row.editable===false
                        ?"whitespace-nowrap text-2xl font-semibold leading-tight text-neutral-400"
                        :"whitespace-nowrap text-2xl font-bold leading-tight"
                    }
                    style={
                      row.editable===false
                        ?undefined
                        :{ color:textColor }
                    }
                  >

                    {row.value}

                  </span>

                  {row.secondary && (

                    <span className="max-w-24 truncate text-xs leading-tight text-neutral-400">

                      {row.secondary}

                    </span>

                  )}

                </div>

              </div>

            )
          )}

        </div>

      ) : isMobile ? (

        <div className="flex min-w-0 flex-col gap-1.5">

          {rows.map(
            row=>(

              <div
                key={row.label}
                className="flex min-w-0 items-baseline justify-between gap-2"
              >

                <p className="min-w-0 shrink truncate text-[11px] font-bold uppercase tracking-[0.14em] text-neutral-500">

                  {row.label}

                </p>

                <div className="flex min-w-0 shrink-0 items-baseline gap-1.5">

                  <span
                    className={
                      row.editable===false
                        ?"whitespace-nowrap text-sm font-semibold leading-tight text-neutral-400"
                        :"whitespace-nowrap text-sm font-bold leading-tight"
                    }
                    style={
                      row.editable===false
                        ?undefined
                        :{ color:textColor }
                    }
                  >

                    {row.value}

                  </span>

                  {row.secondary && (

                    <span className="max-w-20 truncate text-[11px] leading-tight text-neutral-400">

                      {row.secondary}

                    </span>

                  )}

                </div>

              </div>

            )
          )}

        </div>

      ) : (

        <div className="flex min-w-0 flex-1 gap-4">

          {rows.map(
            row=>(

              <div
                key={row.label}
                className="min-w-0 flex-1 border-l border-white/10 pl-3 first:border-l-0 first:pl-0"
              >

                <p className="text-xs font-bold uppercase truncate tracking-[0.16em] text-neutral-500">

                  {row.label}

                </p>

                <div
                  className={
                    row.editable===false
                      ?"mt-1 text-sm font-semibold leading-tight truncate text-neutral-400"
                      :"mt-1 text-sm font-bold leading-tight truncate"
                  }
                  style={
                    row.editable===false
                      ?undefined
                      :{ color:textColor }
                  }
                >

                  {row.value}

                </div>

                {row.secondary && (

                  <p className="mt-0.5 text-xs leading-tight truncate text-neutral-400">

                    {row.secondary}

                  </p>

                )}

              </div>

            )
          )}

        </div>

      )}

    </div>

  )

}