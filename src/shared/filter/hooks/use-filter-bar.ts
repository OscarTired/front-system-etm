"use client"

import {
  useCallback,
  useMemo,
  useState,
} from "react"

import type {
  FilterChip,
  FilterField,
  FilterModule,
  FilterOption,
} from "../types/filter.types"

import {
  getFilterOptions,
} from "../selectors/get-filter-options"

import {
  useFilterStore,
} from "../store/filter-store"

import {
  useUsersDirectory,
} from "@/features/users/hooks/use-users-directory"

import {
  useClients,
} from "@/features/clients/hooks/use-clients"

import {
  useStages,
} from "@/features/stages/hooks/use-stages"

import {
  useStatuses,
} from "@/features/statuses/hooks/use-statuses"

import {
  usePriorities,
} from "@/features/priorities/hooks/use-priorities"

export function useFilterBar(module: FilterModule) {

  const [open, setOpenRaw] = useState(false)

  const [selectedField, setSelectedField] =
    useState<FilterField | undefined>()

  const [editingChip, setEditingChip] =
    useState<FilterChip | undefined>()

  /** Borrador multi-select del sheet de valores (solo se aplica con Listo). */
  const [draft, setDraft] = useState<FilterOption[]>([])

  const { users } = useUsersDirectory()

  const { clients } = useClients()

  const { stages } = useStages()

  const { statuses } = useStatuses()

  const { priorities } = usePriorities()

  const chips = useFilterStore(
    state => state.filters[module]
  )

  const addFilter = useFilterStore(
    state => state.addFilter
  )

  const updateFilter = useFilterStore(
    state => state.updateFilter
  )

  const removeFilter = useFilterStore(
    state => state.removeFilter
  )

  const setOpen = useCallback((next: boolean) => {
    setOpenRaw(next)
    if (!next) {
      setSelectedField(undefined)
      setDraft([])
    }
  }, [])

  const availableOptions = useMemo(() => {

    if (!selectedField) return []

    return getFilterOptions({
      module,
      field: selectedField,
      clients,
      priorities,
      stages,
      statuses,
      users,
    }).filter(option =>
      !chips.some(
        chip =>
          chip.field === selectedField &&
          chip.value === option.value
      )
    )

  }, [
    module,
    selectedField,
    clients,
    priorities,
    stages,
    statuses,
    users,
    chips,
  ])

  const availableChipOptions = useMemo(() => {

    if (!editingChip) return []

    return getFilterOptions({
      module,
      field: editingChip.field,
      clients,
      priorities,
      stages,
      statuses,
      users,
    }).filter(option =>
      !chips.some(
        chip =>
          chip.field === editingChip.field &&
          chip.value === option.value &&
          chip.value !== editingChip.value
      )
    )

  }, [
    module,
    editingChip,
    clients,
    priorities,
    stages,
    statuses,
    users,
    chips,
  ])

  const handleFieldSelect = useCallback((field: FilterField) => {
    setDraft([])
    setSelectedField(field)
  }, [])

  const handleBack = useCallback(() => {
    setDraft([])
    setSelectedField(undefined)
  }, [])

  const handleDraftToggle = useCallback((option: FilterOption) => {
    setDraft(prev => {
      const exists = prev.some(o => o.value === option.value)
      if (exists) return prev.filter(o => o.value !== option.value)
      return [...prev, option]
    })
  }, [])

  const handleValueSelect = useCallback(
    (option: FilterOption) => {
      // compat: single option still works if called
      if (!selectedField) return
      addFilter(module, {
        field: selectedField,
        value: option.value,
        label: option.label,
        color: option.color,
        icon: option.icon,
      })
      setSelectedField(undefined)
      setOpenRaw(false)
    },
    [module, selectedField, addFilter],
  )

  /** Multi-select global: Listo del sheet aplica el borrador. */
  const handleValueConfirm = useCallback(() => {
    if (!selectedField || draft.length === 0) return
    for (const option of draft) {
      addFilter(module, {
        field: selectedField,
        value: option.value,
        label: option.label,
        color: option.color,
        icon: option.icon,
      })
    }
    setDraft([])
    setSelectedField(undefined)
    setOpenRaw(false)
  }, [module, selectedField, draft, addFilter])

  const handleChipUpdate = useCallback(
    (option: FilterOption) => {

      if (!editingChip) return

      updateFilter(module, editingChip, {
        field: editingChip.field,
        value: option.value,
        label: option.label,
        color: option.color,
        icon: option.icon,
      })

      setEditingChip(undefined)

    },
    [module, editingChip, updateFilter]
  )

  const handleChipRemove = useCallback(() => {

    if (!editingChip) return

    removeFilter(module, editingChip)

    setEditingChip(undefined)

  }, [module, editingChip, removeFilter])

  const handleDirectChipRemove = useCallback(
    (chip: FilterChip) => {
      removeFilter(module, chip)
    },
    [module, removeFilter]
  )

  return {

    chips,

    open,
    setOpen,

    selectedField,

    editingChip,
    setEditingChip,

    availableOptions,
    availableChipOptions,

    draft,
    handleDraftToggle,
    handleBack,
    handleFieldSelect,
    handleValueSelect,
    handleValueConfirm,
    handleChipUpdate,
    handleChipRemove,
    handleDirectChipRemove,

  }

}