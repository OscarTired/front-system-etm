"use client"

import{
  ChevronLeft,
}from"lucide-react"

import{
  Command,
  CommandGroup,
  CommandList,
}from"@/components/ui/command"

import{
  SelectOption,
}from"@/shared/ui/select-option/select-option"

import type{
  ExportFormat,
  ExportScope,
  ExportScopeOption,
}from"../types/export.types"

type Props={

  format:ExportFormat

  scopes:Record<
    ExportFormat,
    ExportScopeOption[]
  >

  onBack:()=>void

  onSelect:(scope:ExportScope)=>void

}

export function ExportScopeView({

  format,

  scopes,

  onBack,

  onSelect,

}:Props){

  return(

    <Command
      className="bg-transparent"
    >

      <div className="mb-2 flex items-center gap-2">

        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-1 text-foreground/60 transition-colors hover:text-foreground"
        >

          <ChevronLeft
            size={14}
          />

          <span className="text-xs font-semibold uppercase tracking-[0.08em]">

            {format==="pdf"
              ?"PDF"
              :"EXCEL"}

          </span>

        </button>

      </div>

      <CommandList
        className="max-h-none overflow-visible tablet:max-h-64 tablet:overflow-y-auto"
      >

        <CommandGroup>

          {scopes[format].map(
            option=>(

              <SelectOption
                key={option.value}
                label={option.label}
                icon={option.icon}
                color={option.color}
                selected={false}
                onSelect={()=>
                  onSelect(
                    option.value,
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