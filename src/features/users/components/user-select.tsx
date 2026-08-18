"use client"

import { useMemo, useRef, useState } from "react"
import { Search, ChevronDown } from "lucide-react"

import { Input } from "@/components/ui/input"
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
import { DynamicBadge } from "@/shared/ui/badge/dynamic-badge"
import { SelectOption } from "@/shared/ui/select-option/select-option"
import { ENTITY_ICONS } from "@/shared/constants/entity-icons"
import { cn } from "@/shared/utils/utils"
import { useBadgeColors } from "@/shared/utils/use-badge-colors"
import { useResponsive } from "@/shared/responsive/hooks/use-responsive"
import { useThemeStore } from "@/shared/theme"
import type { User } from "../types/user.types"

type ItemMeta = {
  description?: string
  descriptionColor?: string
}

type BaseProps = {
  items: User[]
  itemMeta?: Map<string, ItemMeta>
  placeholder: string
  disabled?: boolean
  triggerVariant?: "badge" | "row"
  rowLabel?: string
}

type SingleProps = BaseProps & {
  multi?: false
  value?: User
  onChange: (user?: User) => void
  values?: never
  onValuesChange?: never
}

type MultiProps = BaseProps & {
  multi: true
  values: User[]
  onValuesChange: (users: User[]) => void
  value?: never
  onChange?: never
}

type Props = SingleProps | MultiProps

export function UserSelect(props: Props) {
  const {
    items,
    itemMeta,
    placeholder,
    disabled = false,
    triggerVariant = "badge",
    rowLabel,
  } = props

  const multi = props.multi === true
  const values: User[] = multi
    ? props.values
    : props.value
      ? [props.value]
      : []

  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)
  const { isCompact } = useResponsive()

  const primary = values[0]
  const extraCount = Math.max(0, values.length - 1)
  const nameBadge = useBadgeColors(primary?.color ?? "#737373", "subtle")
  const themeResolved = useThemeStore(s => s.resolved)
  // Dark: color de dominio (no lavado). Light: contraste garantizado.
  const nameInk =
    themeResolved === "dark"
      ? (primary?.color ?? "#a3a3a3")
      : nameBadge.text

  const selectedIds = useMemo(
    () => new Set(values.map(u => u.id)),
    [values],
  )

  const RowIcon = primary?.icon
    ? ENTITY_ICONS[primary.icon]
    : undefined

  const filteredItems = useMemo(() => {
    const search = query.trim().toLowerCase()
    const source = search
      ? items.filter(u => u.name.toLowerCase().includes(search))
      : items
    const selected = values.filter(u => source.some(s => s.id === u.id))
    const rest = source.filter(u => !selectedIds.has(u.id))
    return [...selected, ...rest]
  }, [items, query, values, selectedIds])

  const close = () => {
    setOpen(false)
    setQuery("")
  }

  function handleToggle(user: User) {
    if (multi) {
      const exists = selectedIds.has(user.id)
      const next = exists
        ? values.filter(u => u.id !== user.id)
        : [...values, user]
      props.onValuesChange(next)
      return
    }
    const isDeselecting = primary?.id === user.id
    props.onChange(isDeselecting ? undefined : user)
    close()
  }

  const badgeLabel =
    values.length === 0
      ? placeholder
      : extraCount > 0
        ? `${primary!.name} +${extraCount}`
        : primary!.name

  return (
    <Popover
      open={disabled ? false : open}
      onOpenChange={nextOpen => {
        if (disabled) return
        setOpen(nextOpen)
        if (!nextOpen) setQuery("")
        else if (!isCompact) {
          requestAnimationFrame(() => inputRef.current?.focus())
        }
      }}
    >
      <PopoverTrigger asChild disabled={disabled}>
        {triggerVariant === "row" ? (
          <button
            type="button"
            disabled={disabled}
            className="flex w-full min-w-0 items-center justify-between gap-2 rounded-lg bg-foreground/5 px-3 py-2.5 text-left transition hover:bg-foreground/5 disabled:cursor-not-allowed disabled:opacity-50"
          >
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
                  style={{ color: nameInk }}
                />
              )}
              <span
                className="truncate text-sm font-semibold"
                style={{ color: nameInk }}
              >
                {badgeLabel}
              </span>
            </span>
            {rowLabel && (
              <span className="shrink-0 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                {rowLabel}
              </span>
            )}
          </button>
        ) : (
          <button
            type="button"
            disabled={disabled}
            className="flex w-full min-w-0 items-center disabled:cursor-not-allowed"
          >
            <DynamicBadge
              label={badgeLabel}
              color={primary ? primary.color : "#64748B"}
              icon={primary?.icon}
              placeholder={values.length === 0}
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
        <Command value={primary?.name} className="bg-transparent">
          <div className="sticky top-0 z-20 mb-2 flex items-center gap-2 px-2 pb-2">
            <Search size={14} className="text-foreground/35" />
            <Input
              ref={inputRef}
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Buscar..."
              className="h-9 border-0 bg-transparent px-0 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
            />
          </div>

          {multi && values.length > 0 && (
            <p className="mb-1 px-2 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
              {values.length === 1
                ? "1 operario · tocá para agregar más"
                : `${values.length} operarios · el primero es primary`}
            </p>
          )}

          <CommandList className="max-h-none min-w-0 w-full overflow-visible tablet:max-h-64 tablet:overflow-y-auto">
            <CommandEmpty>Sin resultados</CommandEmpty>
            <CommandGroup>
              {filteredItems.map(user => {
                const meta = itemMeta?.get(user.id)
                const isPrimary = primary?.id === user.id
                const selected = selectedIds.has(user.id)
                return (
                  <SelectOption
                    key={user.id}
                    label={
                      isPrimary && multi && values.length > 1
                        ? `${user.name} · primary`
                        : user.name
                    }
                    icon={user.icon}
                    color={user.color}
                    selected={selected}
                    description={meta?.description}
                    descriptionColor={meta?.descriptionColor}
                    onSelect={() => handleToggle(user)}
                  />
                )
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
