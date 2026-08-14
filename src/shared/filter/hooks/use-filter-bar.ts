"use client"

import { useCallback, useMemo, useState } from "react"

import type {
  FilterChip,
  FilterField,
  FilterModule,
  FilterOption,
} from "../types/filter.types"
import { getFilterOptions } from "../selectors/get-filter-options"
import { useFilterStore } from "../store/filter-store"
import { useUsersDirectory } from "@/features/users/hooks/use-users-directory"
import { useClients } from "@/features/clients/hooks/use-clients"
import { useStages } from "@/features/stages/hooks/use-stages"
import { useStatuses } from "@/features/statuses/hooks/use-statuses"
import { usePriorities } from "@/features/priorities/hooks/use-priorities"

export function useFilterBar(module: FilterModule) {
  const [open, setOpenRaw] = useState(false)
  const [selectedField, setSelectedField] = useState<FilterField | undefined>()
  const [editingChip, setEditingChip] = useState<FilterChip | undefined>()

  /**
   * Borrador GLOBAL del sheet: puede mezclar ESTADO + ETAPA + …
   * Solo se escribe al store con Listo. Cerrar sin Listo descarta.
   */
  const [draft, setDraft] = useState<FilterChip[]>([])

  const { users } = useUsersDirectory()
  const { clients } = useClients()
  const { stages } = useStages()
  const { statuses } = useStatuses()
  const { priorities } = usePriorities()

  const chips = useFilterStore(state => state.filters[module])
  const addFilter = useFilterStore(state => state.addFilter)
  const updateFilter = useFilterStore(state => state.updateFilter)
  const removeFilter = useFilterStore(state => state.removeFilter)

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
    }).filter(
      option =>
        !chips.some(
          chip =>
            chip.field === selectedField && chip.value === option.value,
        ),
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
    }).filter(
      option =>
        !chips.some(
          chip =>
            chip.field === editingChip.field &&
            chip.value === option.value &&
            chip.value !== editingChip.value,
        ),
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
    // NO limpia draft: se acumulan varias listas hasta Listo
    setSelectedField(field)
  }, [])

  const handleBack = useCallback(() => {
    // Vuelve al menú de campos; el borrador se conserva
    setSelectedField(undefined)
  }, [])

  const handleDraftToggle = useCallback(
    (option: FilterOption) => {
      if (!selectedField) return
      setDraft(prev => {
        const exists = prev.some(
          c => c.field === selectedField && c.value === option.value,
        )
        if (exists) {
          return prev.filter(
            c => !(c.field === selectedField && c.value === option.value),
          )
        }
        return [
          ...prev,
          {
            field: selectedField,
            value: option.value,
            label: option.label,
            color: option.color,
            icon: option.icon,
          },
        ]
      })
    },
    [selectedField],
  )

  const handleValueSelect = useCallback(
    (option: FilterOption) => {
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
      setDraft([])
    },
    [module, selectedField, addFilter],
  )

  /** Listo global: aplica todo el borrador (todas las listas). */
  const handleValueConfirm = useCallback(() => {
    if (draft.length === 0) return
    for (const chip of draft) {
      addFilter(module, chip)
    }
    setDraft([])
    setSelectedField(undefined)
    setOpenRaw(false)
  }, [module, draft, addFilter])

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
    [module, editingChip, updateFilter],
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
    [module, removeFilter],
  )

  /** Opciones marcadas del campo actual (para checks en la lista). */
  const draftValuesForField = useMemo(() => {
    if (!selectedField) return new Set<string>()
    return new Set(
      draft.filter(c => c.field === selectedField).map(c => c.value),
    )
  }, [draft, selectedField])

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
    draftValuesForField,
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
