"use client"

import React from "react"

import {
  Input,
} from "@/components/ui/input"

import type {
  EntityEditorProps,
} from "../entity-dialog.types"

export const EntityNameInput=
  React.forwardRef<
    HTMLInputElement,
    EntityEditorProps
  >(
    (
      {
        value,
        onChange,
      },
      ref
    )=>{

      return(

        <Input
          ref={ref}
          value={value.name}
          maxLength={40}
          placeholder="Nombre"
          onChange={(event)=>{

            const name=
              event.target.value
                .replace(/\r?\n|\r/g," ")
                .trimStart()
                .slice(0,40)

            onChange({
              ...value,
              name,
            })

          }}
          className="text-foreground uppercase placeholder:text-muted-foreground/80"
        />

      )

    }
  )

EntityNameInput.displayName=
  "EntityNameInput"