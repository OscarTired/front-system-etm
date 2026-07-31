"use client"

import{
  Popover,
  PopoverContent,
  PopoverTrigger,
}from"@/components/ui/popover"

import{
  useExportMenu,
}from"../hooks/use-export-menu"

import type{
  ExportFormat,
  ExportScope,
  ExportScopeOption,
}from"../types/export.types"

import{
  ExportTrigger,
}from"./export-trigger"

import{
  ExportFormatView,
}from"./export-format-view"

import{
  ExportScopeView,
}from"./export-scope-view"

type Props={

  scopes:Record<
    ExportFormat,
    ExportScopeOption[]
  >

  onExport:(

    format:ExportFormat,

    scope:ExportScope,

  )=>Promise<void>|void

}

export function ExportMenu({

  scopes,

  onExport,

}:Props){

  const{

    open,

    setOpen,

    selectedFormat,

    handleBack,

    handleClose,

    handleFormatSelect,

  }=useExportMenu()

  async function handleScopeSelect(

    scope:ExportScope,

  ){

    if(!selectedFormat){

      return

    }

    await onExport(

      selectedFormat,

      scope,

    )

    handleClose()

  }

  return(

    <Popover
      open={open}
      onOpenChange={setOpen}
    >

      <PopoverTrigger asChild>

        <ExportTrigger active={open}/>

      </PopoverTrigger>

      <PopoverContent
        align="start"
        sideOffset={8}
        floatingClassName="w-72"
        className="p-2"
      >

        {!selectedFormat?(

          <ExportFormatView
            onSelect={
              handleFormatSelect
            }
          />

        ):(

          <ExportScopeView

            format={
              selectedFormat
            }

            scopes={
              scopes
            }

            onBack={
              handleBack
            }

            onSelect={
              handleScopeSelect
            }

          />

        )}

      </PopoverContent>

    </Popover>

  )

}