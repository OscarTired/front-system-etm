"use client"

import {
  ChevronDown,
  LucideIcon,
  Plus,
  X,
} from "lucide-react"

import {
  cn,
} from "@/shared/utils/utils"

import {
  useResponsive,
} from "@/shared/responsive/hooks/use-responsive"

import {
  getBadgeColors,
  type BadgeVariant,
} from "@/shared/utils/badge-colors"

import {
  ENTITY_ICONS,
  type EntityIcon,
} from "@/shared/constants/entity-icons"

type DynamicBadgeProps={

  label:string

  color:string

  icon?:EntityIcon

  iconComponent?:LucideIcon

  variant?:BadgeVariant

  muted?:boolean

  active?:boolean

  pulse?:boolean

  placeholder?:boolean

  showChevron?:boolean

  chevronOpen?:boolean

  showRemove?:boolean

  onRemove?:()=>void

  compact?:boolean

  reserveActionsSpace?:boolean

  width?:
    | "content"
    | "field"
    | "project"
    | "process"

}

const widthClasses={

  content:"px-2.5",

  field:"w-full px-2.5",

  project:"w-[560px] px-3",

  process:"w-[90px] px-2",

} as const

export function DynamicBadge({

  label,

  color,

  icon,

  iconComponent,

  variant="subtle",

  muted=false,

  active=false,

  pulse=false,

  placeholder=false,

  showChevron=false,

  chevronOpen=false,

  showRemove=false,

  onRemove,

  compact=false,

  width="content",

  reserveActionsSpace=false,

}:DynamicBadgeProps){

  const { isMobile } = useResponsive()

  // "project" es la única variante con ancho fijo grande (560px),
  // pensada para desktop. En mobile eso se desborda del viewport —
  // acá se vuelve w-full, igual que "field", sin tocar las demás
  // variantes ("content", "process") que ya son de ancho chico o
  // automático y no tienen este problema.
  const resolvedWidthClass=
    width==="project" && isMobile
      ? "w-full px-3"
      : widthClasses[width]

  const safeHex=
    color ?? "#64748B"

  const badgeColors=
    getBadgeColors(
      safeHex,
      variant
    )

  const Icon=
    placeholder
      ? Plus
      : iconComponent
        ? iconComponent
        : icon
          ? ENTITY_ICONS[icon]
          : undefined

  const textColor=

    placeholder

      ? "var(--muted-foreground)"

      : muted

        ? "var(--muted-foreground)"

        : badgeColors.text

  const backgroundColor=

    placeholder

      ? "var(--muted)"

      : muted

        ? "var(--muted)"

        : active

          ? badgeColors.backgroundActive

          : badgeColors.background

  const boxShadow=

    active

      ? badgeColors.shadow.active

      : badgeColors.shadow.default

  const actionColor=

    muted

      ? "var(--muted-foreground)"

      : badgeColors.text

  return(

    <span
      className={cn(

        "group relative inline-flex min-w-0 select-none items-center rounded-full text-xs font-semibold uppercase tracking-[0.06em]",

        compact
          ? "h-8"
          : "min-h-8 py-1.5",

        "transition duration-150 ease-out",

        pulse && "animate-pulse",

        resolvedWidthClass,

      )}
      style={{

        color:textColor,

        backgroundColor,

        boxShadow:

          muted ||
          placeholder

            ? undefined

            : boxShadow,

      }}
      onMouseDown={event=>
        event.preventDefault()
      }
      onMouseEnter={(event)=>{

        if(
          muted ||
          placeholder ||
          active
        ){
          return
        }

        event.currentTarget.style.boxShadow=
          badgeColors.shadow.hover

        event.currentTarget.style.backgroundColor=
          badgeColors.backgroundHover

      }}
      onMouseLeave={(event)=>{

        if(
          muted ||
          placeholder ||
          active
        ){
          return
        }

        event.currentTarget.style.boxShadow=
          badgeColors.shadow.default

        event.currentTarget.style.backgroundColor=
          badgeColors.background

      }}
    >

      <div
        className={cn(
          "w-full items-center",
          (showChevron || showRemove)
            ? "grid grid-cols-[1fr_auto_1fr] gap-x-2"
            : "flex justify-center",
        )}
      >

        {(showChevron || showRemove) && <span aria-hidden />}

        <div className="flex min-w-0 items-center justify-center gap-1.5">

          {Icon && (

            <span className="flex shrink-0 items-center justify-center leading-none">

              <Icon
                size={14}
              />

            </span>

          )}

          <span className="min-w-0 truncate leading-none">

            {label}

          </span>

        </div>

        {(showChevron || showRemove) && (

          <div className="relative ml-auto flex h-3.5 w-3.5 shrink-0 items-center justify-center">

            {showChevron && (

              <ChevronDown
                size={14}
                style={{
                  color:actionColor,
                }}
                className={cn(

                  "absolute inset-0 transition duration-200 ease-out",

                  showRemove &&
                    "opacity-0 tablet:opacity-50 tablet:group-hover:scale-75 tablet:group-hover:opacity-0",

                  !showRemove &&
                    "opacity-50",

                  chevronOpen &&
                    "rotate-180"

                )}
              />

            )}

            {showRemove && onRemove && (

              <span
                role="button"
                tabIndex={0}
                onClick={(event)=>{

                  event.preventDefault()
                  event.stopPropagation()

                  onRemove()

                }}
                onKeyDown={(event)=>{

                  if(
                    event.key==="Enter" ||
                    event.key===" "
                  ){

                    event.preventDefault()

                    onRemove()

                  }

                }}
                style={{
                  color:actionColor,
                }}
                className={cn(

                  "absolute inset-0 flex cursor-pointer items-center justify-center transition duration-200 ease-out",

                  "scale-100 opacity-100 tablet:scale-75 tablet:opacity-0 tablet:group-hover:scale-100 tablet:group-hover:opacity-100",

                )}
              >

                <X
                  size={12}
                  strokeWidth={2.5}
                  className="transition-transform duration-150 hover:scale-110"
                />

              </span>

            )}

          </div>

        )}

      </div>

    </span>

  )

}