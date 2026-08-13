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
  type TaskSortMode,
} from "../store/sort-store"
import { TaskSortTrigger } from "./task-sort-trigger"

const SORT_OPTIONS: {
  value: TaskSortMode
  label: string
  color: string
  icon: EntityIcon
}[] = [
  {
    value: "priority",
    label: "Prioridad",
    color: "#EF4444",
    icon: "urgent",
  },
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
    color: "#64748B",
    icon: "settings",
  },
]

export function TaskSortButton() {
  const [open, setOpen] = useState(false)

  const taskSortMode = useSortStore(s => s.taskSortMode)
  const setTaskSortMode = useSortStore(s => s.setTaskSortMode)
  const taskSortDirection = useSortStore(s => s.taskSortDirection)
  const toggleTaskSortDirection = useSortStore(s => s.toggleTaskSortDirection)

  const current = SORT_OPTIONS.find(o => o.value === taskSortMode)
  const dirLabel = taskSortDirection === "asc" ? "ASC" : "DESC"
  const triggerLabel =
    taskSortMode === "manual"
      ? (current?.label ?? "MANUAL")
      : `${(current?.label ?? "PRIORIDAD").toUpperCase()} · ${dirLabel}`

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <TaskSortTrigger label={triggerLabel} active={open} />
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
                  selected={option.value === taskSortMode}
                  disableCheckAnimation
                  onSelect={() => {
                    setTaskSortMode(option.value)
                    setOpen(false)
                  }}
                />
              ))}
            </CommandGroup>
          </CommandList>
        </Command>

        {taskSortMode !== "manual" && (
          <button
            type="button"
            onClick={() => toggleTaskSortDirection()}
            className="mt-1 flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-xs text-muted-foreground transition hover:bg-foreground/5"
          >
            <span className="flex items-center gap-2">
              {taskSortDirection === "asc" ? (
                <ArrowUpAZ className="size-3.5 text-cyan-700 dark:text-primary" />
              ) : (
                <ArrowDownAZ className="size-3.5 text-cyan-700 dark:text-primary" />
              )}
              Dirección
            </span>
            <span className="font-semibold tabular-nums text-cyan-700 dark:text-primary">
              {dirLabel}
            </span>
          </button>
        )}
      </PopoverContent>
    </Popover>
  )
}
