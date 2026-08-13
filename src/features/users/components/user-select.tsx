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

  // "badge" (default): sin cambios. "row": fila compacta, mismo
  // layout siempre (mobile y desktop) — ícono+valor+chevron primero,
  // label al final.
  triggerVariant?:"badge"|"row"
  rowLabel?:string

}

export function UserSelect({

  value,

  items,

  placeholder,

  onChange,

  disabled=false,

  triggerVariant="badge",
  rowLabel,

}:Props){

  const [open,setOpen]=
    useState(false)

  const [query,setQuery]=
    useState("")

  const inputRef=
    useRef<HTMLInputElement>(null)

  const { isCompact } = useResponsive()

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
            <span className="shrink-0 text-xs font-medium text-muted-foreground">
              {rowLabel}
            </span>
          )

          return (

            <button
              type="button"
              disabled={disabled}
              className="flex w-full min-w-0 items-center justify-between gap-2 rounded-lg bg-foreground/5 px-3 py-2.5 text-left transition hover:bg-foreground/5 disabled:cursor-not-allowed disabled:opacity-50"
            >

              {/* Un solo layout siempre (mobile y desktop) — el
                  orden que ya funcionaba bien en desktop. */}
              <span className="flex min-w-0 items-center gap-1.5">

                {!disabled && (
                  <ChevronDown
                    size={14}
                    className={cn(
                      "shrink-0 text-muted-foreground transition-transform duration-200",
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

              {labelEl}

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
        floatingClassName="w-72"
        className="p-2"
        align={triggerVariant === "row" ? "start" : "center"}
      >

        <Command
          value={value?.name}
          className="bg-transparent"
        >

          <div className="sticky top-0 z-20 mb-2 flex items-center gap-2 px-2 pb-2">

            <Search
              size={14}
              className="text-foreground/35"
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
            className="max-h-64 min-w-0 w-full"
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