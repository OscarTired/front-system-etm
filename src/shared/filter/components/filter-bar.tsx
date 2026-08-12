"use client"

import type {
  FilterModule,
} from "../types/filter.types"

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

import {
  useFilterBar,
} from "../hooks/use-filter-bar"

import {
  FilterAddButton,
} from "./filter-add-button"

import {
  FilterFieldView,
} from "./filter-field-view"

import {
  FilterValueView,
} from "./filter-value-view"

import {
  FilterChipPopover,
} from "./filter-chip-popover"

type Props={
  module:FilterModule
  /** Fuerza el texto "+ FILTRO" visible sin depender de si hay
   * chips activos — para usar dentro del FAB de mobile, donde el
   * resto de los ítems (Historial, Exportar, etc.) siempre
   * muestran su texto, sin importar su estado. */
  alwaysExpanded?:boolean
  /**
   * false = no renderiza el botón "+ FILTRO"/popover para agregar.
   * Para usar al lado de la lupa (EntityToolbar), donde el punto de
   * entrada para AGREGAR un filtro vive en el FAB (`showAddButton`
   * default ahí) — acá solo se muestran los chips ya elegidos.
   * Default: true.
   */
  showAddButton?:boolean
  /**
   * false = no renderiza los chips activos. Para usar DENTRO del
   * FAB, donde el botón de agregar ya vive en su propia fila y los
   * chips elegidos se muestran aparte, al lado de la lupa — así no
   * se duplican. Default: true.
   */
  showChips?:boolean
}

export function FilterBar({
  module,
  alwaysExpanded=false,
  showAddButton=true,
  showChips=true,
}:Props){

  const {

    chips,

    open,
    setOpen,

    selectedField,

    editingChip,
    setEditingChip,

    availableOptions,
    availableChipOptions,

    handleBack,

    handleFieldSelect,

    handleValueSelect,

    handleChipUpdate,

    handleDirectChipRemove,

  }=
    useFilterBar(
      module
    )

  return(

    <div className="flex items-center gap-2">

      {showAddButton && (

      <Popover
        open={open}
        onOpenChange={setOpen}
      >

        <PopoverTrigger asChild>

          <FilterAddButton
            expanded={
              alwaysExpanded ||
              chips.length>0
            }
            active={open}
            hasActiveFilters={chips.length>0}
            onClick={()=>{}}
          />

        </PopoverTrigger>

        <PopoverContent
          align="start"
          sideOffset={8}
          floatingClassName="w-64"
          className="p-2"
        >

          {!selectedField ? (

            <FilterFieldView
              module={module}
              onSelect={
                handleFieldSelect
              }
            />

          ) : (

            <FilterValueView
              selectedField={
                selectedField
              }
              availableOptions={
                availableOptions
              }
              onBack={
                handleBack
              }
              onSelect={
                handleValueSelect
              }
            />

          )}

        </PopoverContent>

      </Popover>

      )}

      {showChips && chips.length>0 && (

        <div className="flex items-center gap-2">

          {chips.map(
            chip=>(

              <FilterChipPopover
                key={`${chip.field}-${chip.value}`}
                chip={chip}
                open={
                  editingChip?.field===
                    chip.field &&

                  editingChip?.value===
                    chip.value
                }
                onOpenChange={
                  open=>

                    setEditingChip(
                      open
                        ? chip
                        : undefined
                    )
                }
                options={
                  availableChipOptions
                }
                onSelect={
                  handleChipUpdate
                }
                onRemove={()=>

                  handleDirectChipRemove(
                    chip
                  )

                }
              />

            )
          )}

        </div>

      )}

    </div>

  )

}