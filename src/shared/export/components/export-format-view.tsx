"use client"

import{
  ChevronRight,
}from"lucide-react"

import{
  Command,
  CommandGroup,
  CommandList,
}from"@/components/ui/command"

import{
  SelectOption,
}from"@/shared/ui/select-option/select-option"

import{
  EXPORT_FORMATS,
}from"../constants/export-config"

import type{
  ExportFormat,
}from"../types/export.types"

type Props={
  onSelect:(
    format:ExportFormat,
  )=>void
}

export function ExportFormatView({
  onSelect,
}:Props){

  return(

    <Command
      className="bg-transparent"
    >

      <CommandList
        className="max-h-none overflow-visible tablet:max-h-64 tablet:overflow-y-auto"
      >

        <CommandGroup>

          {EXPORT_FORMATS.map(
            format=>(

              <SelectOption
                key={format.value}
                label={format.label}
                icon={format.icon}
                color={format.color}
                selected={false}
                rightSlot={
                  <ChevronRight
                    size={14}
                  />
                }
                onSelect={()=>
                  onSelect(
                    format.value,
                  )
                }
              />

            ),
          )}

        </CommandGroup>

      </CommandList>

    </Command>

  )

}