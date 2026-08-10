"use client"

import {
  useState,
} from "react"

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

import {
  SelectOption,
} from "@/shared/ui/select-option/select-option"

import type {
  EntityIcon,
} from "@/shared/constants/entity-icons"

import {
  useSortStore,
  type ProjectSortMode,
} from "../store/sort-store"

import {
  ProjectSortTrigger,
} from "./project-sort-trigger"

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

  const projectSortMode = useSortStore(
    state => state.projectSortMode,
  )

  const setProjectSortMode = useSortStore(
    state => state.setProjectSortMode,
  )

  const current = SORT_OPTIONS.find(
    option => option.value === projectSortMode,
  )

  return (
    <Popover
      open={open}
      onOpenChange={setOpen}
    >
      <PopoverTrigger asChild>
        <ProjectSortTrigger
          label={
            current?.label ??
            "CORRELATIVO"
          }
          active={open}
        />
      </PopoverTrigger>

      <PopoverContent
        align="start"
        sideOffset={8}
        floatingClassName="w-64"
        className="p-2"
      >
        <Command
          className="bg-transparent"
        >
          <CommandList
            className="max-h-80 overflow-y-auto"
          >
            <CommandGroup>
              {SORT_OPTIONS.map(option => (
                <SelectOption
                  key={option.value}
                  label={option.label}
                  icon={option.icon}
                  color={option.color}
                  selected={
                    option.value ===
                    projectSortMode
                  }
                  disableCheckAnimation
                  onSelect={() => {
                    setProjectSortMode(
                      option.value,
                    )
                    setOpen(false)
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