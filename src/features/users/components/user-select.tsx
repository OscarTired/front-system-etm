"use client"

import {
  useMemo,
  useRef,
  useState,
} from "react"

import {
  Search,
  ChevronDown,
} from "lucide-react"

import {
  Input,
} from "@/components/ui/input"

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandList,
} from "@/components/ui/command"

import {
  DynamicBadge,
} from "@/shared/ui/badge/dynamic-badge"

import {
  SelectOption,
} from "@/shared/ui/select-option/select-option"

import {
  ENTITY_ICONS,
} from "@/shared/constants/entity-icons"

import {
  cn,
} from "@/shared/utils/utils"

import {
  useResponsive,
} from "@/shared/responsive/hooks/use-responsive"

import type {
  User,
} from "../types/user.types"

type Props = {

  value?:User

  items:User[]

  placeholder:string

  onChange:(
    user?:User
  )=>void

  disabled?:boolean

  // "badge" (default): sin cambios. "row": fila compacta — mismo
  // patrón que EntitySelect: en mobile label a la izquierda / valor
  // a la derecha; en desktop se invierte (valor primero) y el
  // popover abre alineado a "start".
  triggerVariant?:"badge"|"row"
  rowLabel?:string

  // Ver el mismo comentario en EntitySelect — modo card existe
  // tanto en mobile como en desktop, y ahí la fila siempre es
  // angosta sin importar el ancho real de la ventana.
  forceCompactRow?:boolean

}

export function UserSelect({

  value,

  items,

  placeholder,

  onChange,

  disabled=false,

  triggerVariant="badge",
  rowLabel,
  forceCompactRow=false,

}:Props){

  const [open,setOpen]=
    useState(false)

  const [query,setQuery]=
    useState("")

  const inputRef=
    useRef<HTMLInputElement>(null)

  const { isCompact, isMobile } = useResponsive()

  const compactRow = isMobile || forceCompactRow

  const RowIcon = value?.icon
    ? ENTITY_ICONS[value.icon]
    : undefined

  const filteredItems=
    useMemo(()=>{

      const search=
        query
          .trim()
          .toLowerCase()

      const source=

        search

          ? items.filter(
              user=>

                user.name
                  .toLowerCase()
                  .includes(search)
            )

          : items

      if(!value){

        return source

      }

      return [

        ...source.filter(
          user=>
            user.id===value.id
        ),

        ...source.filter(
          user=>
            user.id!==value.id
        ),

      ]

    },[
      items,
      query,
      value,
    ])

  const close=()=>{

    setOpen(false)

    setQuery("")

  }

  return(

    <Popover
      open={disabled?false:open}
      onOpenChange={nextOpen=>{

        if(disabled){
          return
        }

        setOpen(nextOpen)

        if(!nextOpen){

          setQuery("")

          inputRef.current?.blur()

          return

        }

      }}
    >

      <PopoverTrigger asChild>

        {triggerVariant === "row" ? (() => {

          const labelEl = (
            <span className="shrink-0 text-xs font-medium text-neutral-500">
              {rowLabel}
            </span>
          )

          const valueEl = (
            <span className="flex min-w-0 items-center gap-1.5">

              {!disabled && (

                <ChevronDown
                  size={14}
                  className={cn(
                    "shrink-0 text-neutral-500 transition-transform duration-200",
                    open && "rotate-180",
                  )}
                />

              )}

              {RowIcon && (
                <RowIcon
                  size={14}
                  className="shrink-0"
                  style={{ color: value?.color ?? "#737373" }}
                />
              )}

              <span
                className="truncate text-sm font-semibold"
                style={{ color: value?.color ?? "#737373" }}
              >
                {value?.name ?? placeholder}
              </span>

            </span>
          )

          return (

            <button
              type="button"
              disabled={disabled}
              className="flex w-full min-w-0 items-center justify-between gap-2 rounded-lg bg-white/3 px-3 py-2.5 text-left transition hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-50"
            >

              {/* Mismo criterio que EntitySelect: mobile mantiene
                  label a la izquierda / valor a la derecha; desktop
                  lo invierte (valor primero). */}
              {compactRow ? (
                <>
                  {labelEl}
                  {valueEl}
                </>
              ) : (
                <>
                  {valueEl}
                  {labelEl}
                </>
              )}

            </button>

          )

        })() : (

          <button
            type="button"
            disabled={disabled}
            className="flex w-full min-w-0 items-center disabled:cursor-not-allowed"
          >

            <DynamicBadge
              label={
                value?.name ??
                placeholder
              }
              color={
                value
                  ? value.color
                  : "#64748B"
              }
              icon={value?.icon}
              placeholder={!value}
              width="field"
              showChevron={!disabled}
              chevronOpen={open}
            />

          </button>

        )}

      </PopoverTrigger>

      <PopoverContent
        sideOffset={8}
        className="w-72 p-2"
        align={triggerVariant === "row" && !compactRow ? "start" : "center"}
      >

        <Command
          value={value?.name}
          className="bg-transparent"
        >

          <div className="sticky top-0 z-20 mb-2 flex items-center gap-2 px-2 pb-2">

            <Search
              size={14}
              className="text-white/35"
            />

            <Input
              ref={inputRef}
              value={query}
              onChange={event=>

                setQuery(
                  event.target.value
                )

              }
              placeholder="Buscar..."
              className="h-9 border-0 bg-transparent px-0 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
            />

          </div>

          <CommandList
            className="max-h-64 overflow-y-auto erp-scrollbar"
          >

            <CommandEmpty>

              Sin resultados

            </CommandEmpty>

            <CommandGroup>

              {filteredItems.map(user=>(

                <SelectOption
                  key={user.id}
                  label={user.name}
                  icon={user.icon}
                  color={user.color}
                  selected={
                    value?.id===user.id
                  }
                  onSelect={()=>{

                    const isDeselecting =
                      value?.id===user.id

                    onChange(
                      isDeselecting
                        ?undefined
                        :user
                    )

                    close()

                  }}
                />

              ))}

            </CommandGroup>

          </CommandList>

        </Command>

      </PopoverContent>

    </Popover>

  )

}