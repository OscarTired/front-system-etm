"use client"

import { useState } from "react"
import { ArrowDownAZ, ArrowUpAZ } from "lucide-react"

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Command,
  CommandGroup,
  CommandList,
} from "@/components/ui/command"
import { SelectOption } from "@/shared/ui/select-option/select-option"
import type { EntityIcon } from "@/shared/constants/entity-icons"
import {
  useSortStore,
  type ProjectSortMode,
} from "../store/sort-store"
import { ProjectSortTrigger } from "./project-sort-trigger"

const SORT_OPTIONS: {
  value: ProjectSortMode
  label: string
  color: string
  icon: EntityIcon
}[] = [
  {
    value: "delivery",
    label: "Entrega",
    color: "#06B6D4",
    icon: "clock",
  },
  {
    value: "sequence",
    label: "Secuencia",
    color: "#8B5CF6",
    icon: "document",
  },
  {
    value: "code",
    label: "Correlativo",
    color: "#F59E0B",
    icon: "hash",
  },
  {
    value: "manual",
    label: "Manual",
    color: "#CBD5E1",
    icon: "settings",
  },
]

export function ProjectSortButton() {
  const [open, setOpen] = useState(false)

  const projectSortMode = useSortStore(s => s.projectSortMode)
  const setProjectSortMode = useSortStore(s => s.setProjectSortMode)
  const projectSortDirection = useSortStore(s => s.projectSortDirection)
  const toggleProjectSortDirection = useSortStore(
    s => s.toggleProjectSortDirection,
  )

  const current = SORT_OPTIONS.find(o => o.value === projectSortMode)
  const dirLabel = projectSortDirection === "asc" ? "ASC" : "DESC"
  const triggerLabel =
    projectSortMode === "manual"
      ? (current?.label ?? "MANUAL")
      : `${(current?.label ?? "CORRELATIVO").toUpperCase()} · ${dirLabel}`

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <ProjectSortTrigger label={triggerLabel} active={open} />
      </PopoverTrigger>

      <PopoverContent
        align="start"
        sideOffset={8}
        floatingClassName="w-64"
        className="p-2"
      >
        <Command className="bg-transparent">
          <CommandList className="max-h-80 overflow-y-auto">
            <CommandGroup>
              {SORT_OPTIONS.map(option => (
                <SelectOption
                  key={option.value}
                  label={option.label}
                  icon={option.icon}
                  color={option.color}
                  selected={option.value === projectSortMode}
                  disableCheckAnimation
                  onSelect={() => {
                    setProjectSortMode(option.value)
                    setOpen(false)
                  }}
                />
              ))}
            </CommandGroup>
          </CommandList>
        </Command>

        {projectSortMode !== "manual" && (
          <button
            type="button"
            onClick={() => toggleProjectSortDirection()}
            className="mt-1 flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-xs text-muted-foreground transition hover:bg-foreground/5"
          >
            <span className="flex items-center gap-2">
              {projectSortDirection === "asc" ? (
                <ArrowUpAZ className="size-3.5 text-cyan-400" />
              ) : (
                <ArrowDownAZ className="size-3.5 text-cyan-400" />
              )}
              Dirección
            </span>
            <span className="font-semibold tabular-nums text-cyan-300">
              {dirLabel}
            </span>
          </button>
        )}
      </PopoverContent>
    </Popover>
  )
}
